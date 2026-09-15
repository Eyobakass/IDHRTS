import os

new_views = """
class SystemConfigView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        from users.models import SystemConfig
        configs = SystemConfig.objects.all().values('key', 'value', 'description')
        return Response(list(configs))

    def put(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        from users.models import SystemConfig
        
        key = request.data.get('key')
        value = request.data.get('value')
        
        try:
            config = SystemConfig.objects.get(key=key)
            old_value = config.value
            config.value = value
            config.save()
            
            AuditLog.objects.create(
                actor=request.user,
                action='CONFIG_UPDATED',
                target_id=None,
                target_type='SystemConfig',
                ip_address=self._get_client_ip(request),
                metadata={'key': key, 'old_value': old_value, 'new_value': value}
            )
            return Response({"message": "Config updated successfully"})
        except SystemConfig.DoesNotExist:
            return Response({"error": "Config not found"}, status=404)

from rest_framework import viewsets
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return AuditLog.objects.none()
            
        queryset = AuditLog.objects.all().order_by('-timestamp')
        
        # FR-ADMIN-005 Filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        action = self.request.query_params.get('action')
        role = self.request.query_params.get('role')
        target_type = self.request.query_params.get('target_type')
        
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        if action:
            queryset = queryset.filter(action=action)
        if role:
            queryset = queryset.filter(actor__role=role)
        if target_type:
            queryset = queryset.filter(target_type=target_type)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        # Simple serialization
        data = []
        for log in (page if page is not None else queryset):
            data.append({
                'id': log.id,
                'timestamp': log.timestamp,
                'actor_id': log.actor_id,
                'actor_role': log.actor.role if log.actor else None,
                'actor_name': log.actor.full_name_en if log.actor else None,
                'action': log.action,
                'target_type': log.target_type,
                'target_id': log.target_id,
                'ip_address': log.ip_address,
                'metadata': log.metadata
            })
            
        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)
"""

with open('idhrts_backend/users/views.py', 'a') as f:
    f.write(new_views)
print("Appended Admin Config & Audit views")
