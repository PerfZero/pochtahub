import math
from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import BusinessEventCreateSerializer


class BusinessEventCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        serializer = BusinessEventCreateSerializer(data=request.data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
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

