from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

def send_activation_email(user, profile):
    """
    Send activation email to user with HTML template
    """
    subject = 'Activate Your Account - Student Enrollment System'
    
    activation_url = f"{settings.FRONTEND_URL}/activate/{profile.email_verification_token}"
    
    html_content = render_to_string('emails/activation_email.html', {
        'username': user.username,
        'email': user.email,
        'activation_url': activation_url,
    })
    
    text_content = strip_tags(html_content)
    

    email = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [user.email]
    )
    email.attach_alternative(html_content, "text/html")
    email.send()