from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm

User = get_user_model()


def style_fields(form, placeholders):
    """Give every field the CSS class 'input' and a friendly placeholder."""
    for name, field in form.fields.items():
        field.widget.attrs.update({"class": "input", "placeholder": placeholders.get(name, "")})


class LoginForm(AuthenticationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        style_fields(self, {"username": "Username", "password": "Password"})
        self.fields["username"].widget.attrs["autofocus"] = True


class RegisterForm(UserCreationForm):
    full_name = forms.CharField(max_length=100)
    email = forms.EmailField(required=True)

    field_order = ["full_name", "username", "email", "password1", "password2"]

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        style_fields(
            self,
            {
                "full_name": "Your full name",
                "username": "Pick a username",
                "email": "you@example.com",
                "password1": "Create a password",
                "password2": "Repeat the password",
            },
        )
        self.fields["password1"].label = "Password"
        self.fields["password2"].label = "Confirm password"

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        first, _, last = self.cleaned_data["full_name"].strip().partition(" ")
        user.first_name = first
        user.last_name = last.strip()
        if commit:
            user.save()
        return user
