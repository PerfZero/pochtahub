#!/bin/bash

echo "=== 1. Проверка статуса сервиса pochtahub ==="
systemctl status pochtahub.service --no-pager -l | head -30

echo ""
echo "=== 2. Последние 50 строк server.log ==="
if [ -f /var/www/pochtahub/server.log ]; then
    tail -n 50 /var/www/pochtahub/server.log
else
    echo "Файл server.log не найден"
fi

echo ""
echo "=== 3. Переход в директорию проекта ==="
cd /var/www/pochtahub/backend
source ../venv/bin/activate

echo ""
echo "=== 4. Проверка установленных пакетов ==="
pip list | grep notificore || echo "Библиотека notificore не установлена"

echo ""
echo "=== 5. Установка библиотеки Notificore ==="
pip install git+https://github.com/Notificore/Notificore-python.git

echo ""
echo "=== 6. Проверка синтаксиса Django ==="
python manage.py check

echo ""
echo "=== 7. Перезапуск сервиса ==="
systemctl restart pochtahub
sleep 3

echo ""
echo "=== 8. Проверка статуса после перезапуска ==="
systemctl status pochtahub.service --no-pager -l | head -30

echo ""
echo "=== 9. Проверка процесса Django ==="
ps aux | grep "manage.py runserver" | grep -v grep

echo ""
echo "=== 10. Проверка порта 8000 ==="
netstat -tlnp | grep 8000 || ss -tlnp | grep 8000



