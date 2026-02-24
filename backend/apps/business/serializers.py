from rest_framework import serializers

from .models import BusinessEvent


class BusinessEventCreateSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(required=False, allow_null=True)
    result = serializers.JSONField(required=False)
    metadata = serializers.JSONField(required=False)

    class Meta:
        model = BusinessEvent
        fields = ("event_type", "timestamp", "count_photos", "result", "metadata")

    def validate_count_photos(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("count_photos не может быть меньше 0")
        return value

    def create(self, validated_data):
        timestamp = validated_data.pop("timestamp", None)
        user = self.context.get("user")
        return BusinessEvent.objects.create(
            user=user,
            source="business",
            client_timestamp=timestamp,
            **validated_data,
        )

