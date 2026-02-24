import math
import hashlib
import ipaddress
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BusinessEvent
from .serializers import BusinessEventCreateSerializer


class BusinessEventCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    @staticmethod
    def _extract_client_ip(request):
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded_for:
            ip = forwarded_for.split(",")[0].strip()
            if ip:
                return ip
        return (request.META.get("REMOTE_ADDR") or "").strip()

    @staticmethod
    def _build_ip_metadata(raw_ip):
        if not raw_ip:
            return "", ""

        try:
            parsed = ipaddress.ip_address(raw_ip)
        except ValueError:
            return "", ""

        ip_hash = hashlib.sha256(f"{settings.SECRET_KEY}:{parsed}".encode("utf-8")).hexdigest()

        if parsed.version == 4:
            prefix = ".".join(str(parsed).split(".")[:3]) + ".0/24"
        else:
            exploded = parsed.exploded.split(":")
            prefix = ":".join(exploded[:4]) + "::/64"

        return ip_hash, prefix

    def post(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        event_id = request.data.get("event_id")
        if event_id:
            existing = BusinessEvent.objects.filter(event_id=event_id).only("id").first()
            if existing:
                return Response(
                    {"success": True, "id": existing.id, "deduplicated": True},
                    status=status.HTTP_200_OK,
                )

        raw_ip = self._extract_client_ip(request)
        ip_hash, ip_prefix = self._build_ip_metadata(raw_ip)

        serializer = BusinessEventCreateSerializer(
            data=request.data,
            context={
                "user": user,
                "ip_hash": ip_hash,
                "ip_prefix": ip_prefix,
            },
        )
        serializer.is_valid(raise_exception=True)
        try:
            event = serializer.save()
        except IntegrityError:
            if event_id:
                existing = BusinessEvent.objects.filter(event_id=event_id).only("id").first()
                if existing:
                    return Response(
                        {"success": True, "id": existing.id, "deduplicated": True},
                        status=status.HTTP_200_OK,
                    )
            raise
        return Response({"success": True, "id": event.id}, status=status.HTTP_201_CREATED)


class BusinessTrialStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        trial_start = getattr(user, "created_at", None) or user.date_joined
        trial_end = trial_start + timedelta(days=7)
        now = timezone.now()
        is_trial_active = now <= trial_end
        days_left = (
            max(0, math.ceil((trial_end - now).total_seconds() / 86400))
            if is_trial_active
            else 0
        )

        return Response(
            {
                "user_id": user.id,
                "email": user.email,
                "phone": user.phone,
                "created_at": trial_start,
                "last_login_at": user.last_login,
                "trial_end_at": trial_end,
                "is_trial_active": is_trial_active,
                "days_left": days_left,
                "source": "business",
            }
        )
