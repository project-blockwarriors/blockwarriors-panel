<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Get started · BlockWarriors</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; color: #17231c; background: #f7f9f7; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 16px; line-height: 1.5; }
        main { width: min(100% - 40px, 440px); margin: 64px auto; }
        .brand { display: inline-flex; align-items: center; gap: 12px; color: #17231c; text-decoration: none; font-size: 19px; font-weight: 700; }
        .brand svg { color: #246343; flex: none; }
        section { margin-top: 52px; }
        h1 { font-size: 30px; line-height: 1.2; letter-spacing: -.025em; margin: 0 0 16px; }
        p { margin: 0 0 24px; }
        label { display: block; font-weight: 600; margin-bottom: 8px; }
        input, button { width: 100%; font: inherit; border-radius: 6px; min-height: 48px; }
        input { border: 1px solid #829188; color: inherit; background: white; padding: 11px 12px; }
        input[aria-invalid=true] { border-color: #9d2929; }
        input:focus-visible, button:focus-visible, a:focus-visible { outline: 3px solid #38865c; outline-offset: 3px; }
        button, .primary { display: block; margin-top: 20px; padding: 12px 18px; border: 0; background: #17231c; color: white; cursor: pointer; text-align: center; text-decoration: none; font-weight: 600; border-radius: 6px; }
        button:hover, .primary:hover { background: #2c4837; }
        a { color: #246343; text-underline-offset: 3px; }
        .signin { margin-top: 24px; }
        .help { margin-top: 44px; color: #506057; font-size: 14px; }
        .error { color: #9d2929; margin: 8px 0; font-size: 14px; }
        .g-recaptcha { margin-top: 20px; }
        @media (max-width: 480px) { main { margin-top: 32px; } section { margin-top: 40px; } h1 { font-size: 24px; } }
    </style>
    @if(config('recaptcha.enabled') && $enabled && !session('setup_requested'))
        <script>
            function submitSetup() {
                const form = document.getElementById('setup-form');
                if (form.reportValidity()) {
                    form.querySelector('button').disabled = true;
                    form.querySelector('button').textContent = 'Sending…';
                    form.submit();
                } else {
                    grecaptcha.reset();
                }
            }
            function setupCaptchaError() {
                document.getElementById('captcha-error').hidden = false;
            }
        </script>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    @endif
</head>
<body>
<main>
    <a href="/" class="brand">
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><path d="M2 6h8v8h4V2h8v12h8v8H18v8h-8V18H2Z" fill="currentColor"/></svg>
        BlockWarriors
    </a>
    <section aria-labelledby="heading">
        @if(session('setup_requested'))
            <h1 id="heading">Check your email</h1>
            <p>Look for a BlockWarriors account setup or password reset email. Follow the link to choose your password.</p>
            <p>Already have an account? You can use your usual password.</p>
            <a href="/auth/login" class="primary">Go to sign in</a>
            <p class="help">No email? Check your spam folder, wait a minute, then <a href="/join">try again</a>.</p>
        @elseif(!$enabled)
            <h1 id="heading">Account signup is closed</h1>
            <p>Ask your subteam director for an invitation.</p>
            <a href="/auth/login" class="primary">Sign in</a>
        @else
            <h1 id="heading">Get your MC Panel account</h1>
            <p>Enter your email. We’ll send you a link to set your password.</p>
            <form id="setup-form" method="post" action="/join">
                @csrf
                <label for="email">Email address</label>
                <input id="email" name="email" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" maxlength="191" required value="{{ is_string(old('email')) ? old('email') : '' }}" @if($errors->has('email')) aria-invalid="true" aria-describedby="email-error" @endif>
                @error('email')<p id="email-error" class="error" role="alert">{{ $message }}</p>@enderror
                @if(config('recaptcha.enabled'))
                    <button type="submit" class="g-recaptcha" data-sitekey="{{ config('recaptcha.website_key') }}" data-size="invisible" data-callback="submitSetup" data-error-callback="setupCaptchaError">Send setup link</button>
                    <p id="captcha-error" class="error" role="alert" hidden>The security check could not load. Refresh the page and try again.</p>
                @else
                    <button type="submit">Send setup link</button>
                @endif
            </form>
            <p class="signin">Already have an account? <a href="/auth/login">Sign in</a>.</p>
            <p class="help">Your account gives you access to the panel. Your subteam director will add you to the servers you need.</p>
        @endif
    </section>
</main>
</body>
</html>
