from django.contrib import admin

from .models import BusinessEvent


@admin.register(BusinessEvent)
class BusinessEventAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "event_type",
        "user",
        "anonymous_id",
        "session_id",
        "source",
        "count_photos",
        "created_at",
    )
    list_filter = ("event_type", "source", "device", "created_at")
    search_fields = ("event_id", "user__username", "user__phone", "user__email", "anonymous_id", "session_id")
    readonly_fields = ("created_at",)
