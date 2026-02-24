from rest_framework import serializers

from .models import BusinessEvent


class BusinessEventCreateSerializer(serializers.ModelSerializer):
    event_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=64)
    anonymous_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=64)
    session_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=64)
    path = serializers.CharField(required=False, allow_blank=True, max_length=255)
    referrer = serializers.CharField(required=False, allow_blank=True)
    utm_source = serializers.CharField(required=False, allow_blank=True, max_length=128)
    utm_medium = serializers.CharField(required=False, allow_blank=True, max_length=128)
    utm_campaign = serializers.CharField(required=False, allow_blank=True, max_length=128)
    utm_term = serializers.CharField(required=False, allow_blank=True, max_length=128)
    utm_content = serializers.CharField(required=False, allow_blank=True, max_length=128)
    user_agent = serializers.CharField(required=False, allow_blank=True)
    device = serializers.CharField(required=False, allow_blank=True, max_length=32)
    viewport_width = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    viewport_height = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    timestamp = serializers.DateTimeField(required=False, allow_null=True)
    duration_ms = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    error_code = serializers.CharField(required=False, allow_blank=True, max_length=64)
    error_message = serializers.CharField(required=False, allow_blank=True)
    result = serializers.JSONField(required=False)
    metadata = serializers.JSONField(required=False)

    class Meta:
        model = BusinessEvent
        fields = (
            "event_id",
            "anonymous_id",
            "session_id",
            "event_type",
            "path",
            "referrer",
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "utm_term",
            "utm_content",
            "user_agent",
            "device",
            "viewport_width",
            "viewport_height",
            "timestamp",
            "duration_ms",
            "error_code",
            "error_message",
            "count_photos",
            "result",
            "metadata",
        )

    def validate_count_photos(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("count_photos не может быть меньше 0")
        return value

    def create(self, validated_data):
        ip_hash = self.context.get("ip_hash", "")
        ip_prefix = self.context.get("ip_prefix", "")
        timestamp = validated_data.pop("timestamp", None)
        user = self.context.get("user")
        return BusinessEvent.objects.create(
            user=user,
            source="business",
            client_timestamp=timestamp,
            ip_hash=ip_hash,
            ip_prefix=ip_prefix,
            **validated_data,
        )
