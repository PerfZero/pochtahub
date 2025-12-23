#!/bin/bash

SERVER="root@109.172.46.96"
REPO="https://github.com/PerfZero/pochtahub.git"
PROJECT_DIR="/var/www/pochtahub"

ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
cd /var/www || mkdir -p /var/www
cd /var/www
if [ -d "pochtahub" ]; then
    cd pochtahub
    git pull
else
    git clone https://github.com/PerfZero/pochtahub.git
    cd pochtahub
fi

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
cd backend
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    cat > .env << EOF
SECRET_KEY=django-insecure-change-me-in-production
DEBUG=False
ALLOWED_HOSTS=109.172.46.96,localhost,127.0.0.1

DB_NAME=pochtahub
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://109.172.46.96,http://localhost:3000
EOF
fi

python3 manage.py migrate
python3 manage.py collectstatic --noinput

if ! python manage.py shell -c "from apps.users.models import User; User.objects.filter(is_superuser=True).exists()" 2>/dev/null | grep -q True; then
    python manage.py shell -c "from apps.users.models import User; User.objects.create_superuser('admin', 'admin@example.com', 'admin123')" 2>/dev/null || echo "Суперпользователь уже существует"
fi

echo "Развертывание завершено!"
echo "Для запуска сервера выполните:"
echo "cd $PROJECT_DIR && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
ENDSSH




