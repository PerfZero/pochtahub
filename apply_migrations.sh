#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no root@109.172.46.96
expect "password:"
send "eN0*G!MPKIQD\r"
expect "# "
send "cd /var/www/pochtahub/backend && source ../venv/bin/activate && python3 manage.py migrate\r"
expect "# "
send "exit\r"
expect eof






