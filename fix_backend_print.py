import re

with open('idhrts_backend/properties/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''    def perform_create(self, serializer):
        if self.request.user.role != 'LANDLORD':
            raise PermissionDenied("Only landlords can register properties.")
        serializer.save(landlord=self.request.user, status='DRAFT')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print('PROPERTY CREATION VALIDATION ERROR:', serializer.errors)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)'''

content = content.replace('    def perform_create(self, serializer):\n        # GAP-02: Only landlords may register properties\n        if self.request.user.role != \'LANDLORD\':\n            raise PermissionDenied("Only landlords can register properties.")\n        serializer.save(landlord=self.request.user, status=\'DRAFT\')', replacement)

with open('idhrts_backend/properties/views.py', 'w', encoding='utf-8') as f:
    f.write(content)
