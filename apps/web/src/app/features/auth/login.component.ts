import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { I18n } from '../../core/i18n';
import { BUSINESS_TYPES, BusinessType, Role } from '../../core/models';
import { DEMO_PASSWORD } from '../../core/seed';
import { AppError, Store } from '../../core/store';
import { ThemeService } from '../../core/theme';
import { IconComponent } from '../../shared/icon.component';

const DEMOS: { name: string; email: string; role: Role; org: string; multi?: boolean }[] = [
  { name: 'TBMS Admin', email: 'admin@demo.tz', role: 'OWNER', org: '', multi: true },
  { name: 'Amina Mushi', email: 'amina@demo.tz', role: 'OWNER', org: 'Duka la Amina' },
  { name: 'Juma Kassim', email: 'juma@demo.tz', role: 'MANAGER', org: 'Duka la Amina', multi: true },
  { name: 'Rehema Said', email: 'rehema@demo.tz', role: 'CASHIER', org: 'Duka la Amina' },
  { name: 'Baraka Mwita', email: 'baraka@demo.tz', role: 'INVENTORY', org: 'Duka la Amina' },
  { name: 'Neema Lyimo', email: 'neema@demo.tz', role: 'OWNER', org: 'Neema Hardware' },
];

@Component({
  selector: 'tbms-login',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth">
      <section class="brand-panel">
        <span class="blob b1" aria-hidden="true"></span><span class="blob b2" aria-hidden="true"></span><span class="blob b3" aria-hidden="true"></span>
        <div class="logo"><span class="mark">T</span><span>TBMS</span></div>
        <div class="pitch">
          <h1>{{ i18n.t('auth.pitch') }}</h1>
          <ul>
            <li><tbms-icon name="check" [size]="16" [stroke]="2.4" />{{ i18n.t('auth.f1') }}</li>
            <li><tbms-icon name="check" [size]="16" [stroke]="2.4" />{{ i18n.t('auth.f2') }}</li>
            <li><tbms-icon name="check" [size]="16" [stroke]="2.4" />{{ i18n.t('auth.f3') }}</li>
          </ul>
        </div>
        <div class="art" aria-hidden="true">
          <div class="card c1"><small>{{ i18n.t('dash.revenue') }}</small><b>TZS 4,820,000</b><div class="spark"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
          <div class="card c2"><small>{{ i18n.t('dash.customers') }}</small><b>128</b></div>
        </div>
      </section>

      <section class="form-panel">
        <div class="top-actions">
          <button class="ghost" type="button" (click)="i18n.toggle()" [attr.aria-label]="i18n.t('ui.lang')">
            <tbms-icon name="globe" [size]="16" />{{ i18n.lang() === 'en' ? 'Kiswahili' : 'English' }}
          </button>
          <button class="ghost icon-only" type="button" (click)="theme.toggle()" [attr.aria-label]="i18n.t('ui.theme')">
            <tbms-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="16" />
          </button>
        </div>

        <div class="inner">
          <form (ngSubmit)="submit()" novalidate>
            <div class="mobile-logo"><span class="mark">T</span><span>TBMS</span></div>
            <h2>{{ i18n.t(mode() === 'login' ? 'auth.welcome' : 'auth.create') }}</h2>
            <p class="sub">{{ i18n.t(mode() === 'login' ? 'auth.welcomeHint' : 'auth.createHint') }}</p>

            @if (error()) { <div class="form-error" role="alert"><tbms-icon name="alert" [size]="16" />{{ error() }}</div> }

            @if (mode() === 'register') {
              <label class="field">{{ i18n.t('auth.name') }}<input name="name" [(ngModel)]="name" autocomplete="name" /></label>
              <label class="field">{{ i18n.t('auth.org') }}<input name="org" [(ngModel)]="orgName" autocomplete="organization" /></label>
              <label class="field">{{ i18n.t('auth.bizType') }}
                <select name="bt" [(ngModel)]="businessType">@for (b of types; track b) { <option [value]="b">{{ i18n.t('bt.' + b) }}</option> }</select>
              </label>
            }
            <label class="field">{{ i18n.t('auth.email') }}<input name="email" type="email" [(ngModel)]="email" autocomplete="email" inputmode="email" /></label>
            <label class="field">{{ i18n.t('auth.password') }}
              <span class="pw">
                <input name="password" [type]="showPw() ? 'text' : 'password'" [(ngModel)]="password" [attr.autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'" />
                <button type="button" class="reveal" (click)="showPw.set(!showPw())">{{ i18n.t(showPw() ? 'auth.hide' : 'auth.show') }}</button>
              </span>
              @if (mode() === 'register') { <small>{{ i18n.t('auth.pwHint') }}</small> }
            </label>

            <button class="btn primary" type="submit" [disabled]="busy()">
              @if (busy()) { <span class="spinner"></span> }
              {{ i18n.t(mode() === 'login' ? 'auth.signIn' : 'auth.signUp') }}
            </button>

            <p class="switch">
              {{ i18n.t(mode() === 'login' ? 'auth.noAccount' : 'auth.haveAccount') }}
              <button type="button" class="link" (click)="toggleMode()">{{ i18n.t(mode() === 'login' ? 'auth.toSignUp' : 'auth.toSignIn') }}</button>
            </p>
          </form>

          @if (mode() === 'login') {
            <div class="demos">
              <div class="demos-head"><b>{{ i18n.t('auth.demo') }}</b><small>{{ i18n.t('auth.demoHint') }}</small></div>
              <div class="demo-list">
                @for (d of demos; track d.email) {
                  <button type="button" class="demo" (click)="useDemo(d.email)">
                    <span class="av">{{ initials(d.name) }}</span>
                    <span class="demo-text"><b>{{ d.name }}</b><small>{{ i18n.t('role.' + d.role) }} · {{ d.multi ? i18n.t('auth.twoBiz') : d.org }}</small></span>
                    <tbms-icon name="chevron" [size]="16" />
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .auth{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);background:var(--bg)}
    .brand-panel{background:var(--hero-bg);color:#fff;padding:40px 56px;display:flex;flex-direction:column;overflow:hidden;position:relative;min-height:100vh;isolation:isolate}
    .blob{position:absolute;z-index:-1;border-radius:50%;filter:blur(60px);opacity:.7;animation:drift 18s ease-in-out infinite alternate;pointer-events:none}
    .b1{width:420px;height:420px;background:var(--blob-1);right:-120px;top:-120px}.b2{width:360px;height:360px;background:var(--blob-2);left:-100px;bottom:-80px;opacity:.5;animation-delay:-7s}.b3{width:260px;height:260px;background:var(--blob-3);right:10%;bottom:20%;opacity:.3;animation-delay:-12s}
    @keyframes drift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-50px,40px) scale(1.1)}100%{transform:translate(40px,-30px) scale(.95)}}
    .inner{animation:rise-in .7s var(--ease) both}
    .brand-panel::before{content:"";position:absolute;width:560px;height:560px;right:-180px;bottom:-200px;border-radius:50%;background:radial-gradient(circle,var(--accent-soft),transparent 65%)}
    .logo,.mobile-logo{display:flex;align-items:center;gap:10px;font:800 20px var(--font-display);letter-spacing:-.5px}
    .mark{width:34px;height:34px;border-radius:10px;background:var(--grad-brand);color:#fff;box-shadow:var(--shadow-brand);display:grid;place-items:center;font:800 18px var(--font-display)}
    .pitch{margin-top:auto;max-width:460px;position:relative;z-index:1}
    .pitch h1{font:700 34px/1.15 var(--font-display);letter-spacing:-1px;margin:0 0 28px}
    .pitch ul{list-style:none;padding:0;margin:0;display:grid;gap:12px;color:var(--hero-ink-2);font-size:14px}
    .pitch li{display:flex;align-items:center;gap:10px}
    .pitch li tbms-icon{color:var(--accent)}
    .art{position:relative;height:200px;margin-top:48px;z-index:1}
    .art .card{position:absolute;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:16px;padding:16px 18px;color:#fff}
    .art .card small{display:block;color:var(--hero-ink-3);font-size:11px;margin-bottom:6px}
    .art .card b{font:700 20px var(--font-display);letter-spacing:-.4px}
    .c1{left:0;top:0;width:250px}.c2{left:236px;top:-30px;width:150px}
    .spark{display:flex;align-items:flex-end;gap:5px;height:40px;margin-top:12px}
    .spark i{flex:1;background:linear-gradient(180deg,#ffd27a,#ff8fb1 60%,#b07cff);transform-origin:bottom;animation:grow-up .9s var(--ease) both;border-radius:3px 3px 0 0;opacity:.85}
    .spark i:nth-child(2){animation-delay:.08s}.spark i:nth-child(3){animation-delay:.16s}.spark i:nth-child(4){animation-delay:.24s}.spark i:nth-child(5){animation-delay:.32s}.spark i:nth-child(6){animation-delay:.4s}
    .spark i:nth-child(1){height:35%}.spark i:nth-child(2){height:50%}.spark i:nth-child(3){height:42%}.spark i:nth-child(4){height:68%}.spark i:nth-child(5){height:60%}.spark i:nth-child(6){height:100%}

    .form-panel{display:flex;flex-direction:column;padding:28px 32px}
    .top-actions{display:flex;justify-content:flex-end;gap:8px}
    .inner{width:100%;max-width:420px;margin:auto;padding:24px 0;display:flex;flex-direction:column;gap:28px}
    form{display:flex;flex-direction:column;gap:14px}
    .mobile-logo{display:none;color:var(--text-1);margin-bottom:8px}
    h2{font:700 28px var(--font-display);letter-spacing:-.8px;margin:0;color:var(--text-1)}
    .sub{color:var(--text-2);margin:-6px 0 6px;font-size:14px}
    .pw{position:relative;display:block}.pw input{width:100%;padding-right:80px}
    .reveal{position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--brand);font-weight:600;padding:6px 8px;border-radius:6px}
    .btn.primary{margin-top:6px}
    .switch{text-align:center;color:var(--text-2);font-size:13px;margin:2px 0 0}
    .link{color:var(--brand);font-weight:600;padding:0 2px}.link:hover{text-decoration:underline}
    .spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .demos{border:1px solid var(--border);background:var(--surface);border-radius:16px;padding:14px}
    .demos-head{display:flex;flex-direction:column;gap:2px;padding:2px 4px 10px}
    .demos-head b{font-size:14px;color:var(--text-1)} .demos-head small{color:var(--text-3);font-size:12.5px}
    .demo-list{display:flex;flex-direction:column}
    .demo{display:flex;align-items:center;gap:12px;padding:9px 6px;border-radius:10px;text-align:left;color:var(--text-3);transition:background .2s,transform .2s var(--ease)}
    .demo:hover{transform:translateX(3px)}
    .demo:hover{background:var(--hover);color:var(--text-1)}
    .av{width:34px;height:34px;border-radius:50%;background:var(--grad-brand);color:#fff;display:grid;place-items:center;font-weight:700;font-size:12.5px;flex:none}
    .demo-text{flex:1;min-width:0} .demo-text b{display:block;font-size:14px;color:var(--text-1);font-weight:600} .demo-text small{font-size:12.5px;color:var(--text-3)}
    @media (max-width: 880px){.auth{grid-template-columns:1fr}.brand-panel{display:none}.mobile-logo{display:flex}.form-panel{padding:16px}}
  `],
})
export class LoginComponent {
  readonly i18n = inject(I18n);
  readonly theme = inject(ThemeService);
  private store = inject(Store);
  private router = inject(Router);
  readonly types = BUSINESS_TYPES;
  readonly demos = DEMOS;

  readonly mode = signal<'login' | 'register'>('login');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPw = signal(false);
  // Prototype convenience: the owner demo account is pre-filled so you can just press Sign in.
  name = ''; orgName = ''; email = 'amina@demo.tz'; password = DEMO_PASSWORD; businessType: BusinessType = 'retail';

  initials(n: string) { return n.split(' ').map((p) => p[0]).join(''); }
  toggleMode() {
    const toRegister = this.mode() === 'login';
    this.mode.set(toRegister ? 'register' : 'login');
    // New accounts start blank; going back to sign-in restores the demo login.
    this.email = toRegister ? '' : 'amina@demo.tz';
    this.password = toRegister ? '' : DEMO_PASSWORD;
    this.error.set(null);
  }

  useDemo(email: string) {
    this.email = email;
    this.password = DEMO_PASSWORD;
    this.submit();
  }

  submit() {
    if (this.busy()) return;
    this.error.set(null);
    if (this.mode() === 'register') {
      if (!this.name.trim() || !this.orgName.trim() || !this.email.trim() || !this.password) { this.error.set(this.i18n.t('auth.fillAll')); return; }
      if (this.password.length < 8) { this.error.set(this.i18n.t('auth.pwHint')); return; }
    }
    this.busy.set(true);
    // Small delay so the prototype feels like a network round-trip.
    setTimeout(() => {
      try {
        if (this.mode() === 'login') this.store.login(this.email, this.password);
        else this.store.register({ name: this.name, email: this.email, password: this.password, orgName: this.orgName, businessType: this.businessType });
        this.router.navigateByUrl('/');
      } catch (e) {
        this.error.set(this.i18n.t(e instanceof AppError ? e.key : 'err.generic'));
      } finally {
        this.busy.set(false);
      }
    }, 350);
  }
}
