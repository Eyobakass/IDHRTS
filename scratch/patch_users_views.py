import re

with open('idhrts_backend/users/views.py', 'r') as f:
    content = f.read()

# 1. Fix RegisterView vulnerability
old_register = """class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone_number')
        pin = request.data.get('pin')
        if User.objects.filter(phone_number=phone).exists():
            return Response({"error": "Phone already registered"}, status=400)

        pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
        user = User.objects.create_user(
            phone_number=phone,
            full_name_en=request.data.get('full_name_en', ''),
            full_name_am=request.data.get('full_name_am', ''),
            role=request.data.get('role', 'LANDLORD'),
            pin_hash=pin_hash
        )
        return Response({"message": "User registered successfully", "user_id": user.id}, status=201)"""

new_register = """class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        role = request.data.get('role', 'LANDLORD')
        if role not in ['LANDLORD', 'TENANT']:
            return Response({"error": "You can only register as LANDLORD or TENANT"}, status=400)

        phone = request.data.get('phone_number')
        pin = request.data.get('pin')
        if User.objects.filter(phone_number=phone).exists():
            return Response({"error": "Phone already registered"}, status=400)

        pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
        user = User.objects.create_user(
            phone_number=phone,
            full_name_en=request.data.get('full_name_en', ''),
            full_name_am=request.data.get('full_name_am', ''),
            role=role,
            pin_hash=pin_hash
        )
        return Response({"message": "User registered successfully", "user_id": user.id}, status=201)"""

if old_register in content:
    content = content.replace(old_register, new_register)
    print("Replaced RegisterView")

with open('idhrts_backend/users/views.py', 'w') as f:
    f.write(content)
