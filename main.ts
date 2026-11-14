import { bootstrapApplication } from '@angular/platform-browser'; import { provideHttpClient, withInterceptors } from '@angular/common/http'; import { Component, inject, signal } from '@angular/core'; import { FormsModule } from '@angular/forms'; import { HttpClient } from '@angular/common/http';
interface Summary{revenue:string;expenses:string;customers:number;products:number;currency:string}
@Component({selector:'tbms-root',standalone:true,imports:[FormsModule],template:`@if (token()) {<div class="shell"><aside class="sidebar">
  <div class="brand"><span class="mark">B</span><div><strong>Biashara Rahisi</strong><small>Usimamizi wa biashara</small></div></div>
  <button class="workspace-switcher"><span class="workspace-icon">DE</span><span class="workspace-copy"><small>Biashara yako</small><b>Demo Enterprise</b></span><span class="chevron">⌄</span></button>
  <nav aria-label="Menyu kuu">
    <span class="nav-label">MWONEKANO</span>
    <a class="nav-item active"><span class="nav-icon">⌂</span><span>Muhtasari</span></a>
    <a class="nav-item"><span class="nav-icon">↗</span><span>Mauzo</span></a>
    <a class="nav-item"><span class="nav-icon">▣</span><span>Manunuzi</span></a>
    <a class="nav-item"><span class="nav-icon">▤</span><span>Bidhaa na stok</span></a>
    <a class="nav-item"><span class="nav-icon">♙</span><span>Wateja</span></a>
    <a class="nav-item"><span class="nav-icon">◒</span><span>Matumizi</span></a>
    <span class="nav-label secondary-label">KAMPUNI</span>
    <a class="nav-item"><span class="nav-icon">⚙</span><span>Mipangilio</span></a>
  </nav>
  <div class="sidebar-bottom">
    <div class="help-card"><span class="help-spark">✦</span><div><b>Unahitaji msaada?</b><small>Tupo hapa kwa ajili yako</small></div></div>
    <div class="profile-row"><div class="avatar small-avatar">AO</div><div><b>Amina Omari</b><small>Mmiliki wa biashara</small></div><span class="more">•••</span></div>
  </div>
</aside><main><header><div><p class="eyebrow">DEMO ENTERPRISE</p><h1>Good morning, Amina</h1><p class="muted">Here’s what’s happening across your business today.</p></div><div class="header-actions"><button class="lang">EN / SW</button><button class="avatar">AO</button></div></header><section class="hero"><div><span class="pill">● LIVE OVERVIEW</span><h2>Run your business<br><em>with clarity.</em></h2><p>Track revenue, customers, inventory and expenses from one calm workspace.</p></div><div class="hero-art"><div class="ring ring-a"></div><div class="ring ring-b"></div><div class="bar-chart"><i></i><i></i><i></i><i></i><i></i></div></div></section><section class="metrics"><article><span class="icon green">↗</span><div><span>Revenue</span><strong>{{summary()?.currency}} {{summary()?.revenue || '—'}}</strong><small class="up">↑ 12.5% <b>vs last month</b></small></div></article><article><span class="icon orange">◒</span><div><span>Expenses</span><strong>{{summary()?.currency}} {{summary()?.expenses || '—'}}</strong><small class="up">↓ 4.2% <b>vs last month</b></small></div></article><article><span class="icon purple">♙</span><div><span>Customers</span><strong>{{summary()?.customers ?? '—'}}</strong><small class="up">↑ 8 new <b>this month</b></small></div></article><article><span class="icon blue">▦</span><div><span>Products</span><strong>{{summary()?.products ?? '—'}}</strong><small><b>in catalog</b></small></div></article></section><section class="lower"><div class="panel"><div class="panel-head"><div><h3>Cash flow</h3><p class="muted">Revenue and expenses over the last 6 months</p></div><button class="select">Last 6 months⌄</button></div><div class="chart"><div class="gridline l1"></div><div class="gridline l2"></div><div class="gridline l3"></div><div class="line revenue"></div><div class="line expenses"></div><div class="labels"><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span></div></div><div class="legend"><span><i class="dot green-dot"></i>Revenue</span><span><i class="dot orange-dot"></i>Expenses</span></div></div><div class="panel actions"><div class="panel-head"><div><h3>Quick actions</h3><p class="muted">Keep your records up to date</p></div></div><button><span class="action-icon green">＋</span><div><b>Record a sale</b><small>Capture a completed sale</small></div><span>›</span></button><button><span class="action-icon orange">＋</span><div><b>Add an expense</b><small>Log an operating cost</small></div><span>›</span></button><button><span class="action-icon blue">＋</span><div><b>Add a product</b><small>Update your catalog</small></div><span>›</span></button></div></section></main></div>`} @else {
  <div class="login-shell">
    <section class="login-visual">
      <div class="login-brand"><span class="login-mark">B</span><strong>Biashara Rahisi</strong></div>
      <div class="visual-copy"><span class="visual-kicker">BIASHARA YAKO, KWA URAHISI</span><h1>Mauzo, stoo,<br>wateja na matumizi<br><em>sehemu moja.</em></h1><p>Fanya kazi kwa ujasiri zaidi ukiwa na picha kamili ya biashara yako kila siku.</p><ul><li>Fuatilia mapato na matumizi kwa urahisi</li><li>Inafanya kazi kwenye simu, tablet na kompyuta</li><li>Kiswahili na Kiingereza</li></ul></div>
      <div class="visual-orbit orbit-a"></div><div class="visual-orbit orbit-b"></div><div class="visual-bars"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="visual-stat stat-revenue"><small>Mapato ya mwezi</small><strong>TZS 4,820,000</strong></div><div class="visual-stat stat-customers"><small>Wateja</small><strong>128</strong></div>
    </section>
    <section class="login-panel">
      <div class="login-tools"><button>◉ &nbsp; Kiswahili⌄</button><button aria-label="Badili mandhari">☾</button></div>
      <div class="login-form-wrap"><span class="form-kicker">KARIBU TENA</span><h2>Ingia kwenye<br>Biashara Rahisi</h2><p class="form-subtitle">Endelea kusimamia biashara yako.</p>
        <form (ngSubmit)="login(email.value,password.value)">
          <label for="email">Barua pepe</label><input #email id="email" type="email" placeholder="amina@demo.tz" autocomplete="email" required>
          <div class="password-label"><label for="password">Nenosiri</label><button type="button">Onyesha</button></div><input #password id="password" type="password" placeholder="••••••••" autocomplete="current-password" required>
          @if (loginError()) { <p class="login-error">{{ loginError() }}</p> }
          <button class="login-submit" type="submit">Ingia <span>→</span></button>
        </form>
        <p class="register-prompt">Huna akaunti? <button type="button">Fungua akaunti</button></p>
      </div>
      <div class="account-preview"><span class="preview-label">Jaribu akaunti ya mfano</span><small>Nenosiri la akaunti zote za mfano: <b>demo1234</b></small><div class="account-row"><span class="account-avatar">TA</span><span><b>Biashara Admin</b><small>Mmiliki · biashara 2</small></span><em>›</em></div><div class="account-row"><span class="account-avatar">AM</span><span><b>Amina Mushi</b><small>Mmiliki · Duka la Amina</small></span><em>›</em></div></div>
    </section>
  </div>
}
`})
export class AppComponent{private http=inject(HttpClient); summary=signal<Summary|null>(null); token=signal<string|null>(localStorage.getItem('tbms_token')); loginError=signal(''); constructor(){if(this.token())this.loadSummary(this.token()!);} loadSummary(token:string){this.http.get<Summary>('/api/dashboard/summary',{headers:{Authorization:`Bearer ${token}`}}).subscribe({next:v=>this.summary.set(v)});} login(email:string,password:string){this.loginError.set(''); this.http.post<any>('/api/auth/login',{email,password}).subscribe({next:r=>{localStorage.setItem('tbms_token',r.accessToken);this.token.set(r.accessToken);this.loadSummary(r.accessToken);},error:()=>this.loginError.set('Barua pepe au nenosiri si sahihi')});}}
bootstrapApplication(AppComponent,{providers:[provideHttpClient()]});





