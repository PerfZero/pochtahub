from rest_framework import serializers
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ('phone', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        phone = validated_data.get('phone', '')
        username = f"user_{phone.replace('+', '').replace(' ', '').replace('-', '')}_{uuid.uuid4().hex[:6]}"
        validated_data['username'] = username
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
