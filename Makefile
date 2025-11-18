.PHONY: install migrate runserver shell superuser

install:
	pip install -r requirements.txt

migrate:
	python manage.py makemigrations
	python manage.py migrate

runserver:
	python manage.py runserver

shell:
	python manage.py shell

superuser:
	python manage.py createsuperuser
