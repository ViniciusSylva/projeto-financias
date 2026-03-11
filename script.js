// ==================== DATA LAYER ====================
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function load(key, fb) { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fb; } catch { return fb; } }
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function uuid() { return crypto.randomUUID(); }
function fmt(v) { return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }
let cardExpenses = load("finance_card_expenses", []);
let generalExpenses = load("finance_general_expenses", []);
let incomes = load("finance_incomes", []);
let goals = load("finance_goals", []);
function persist() {
  save("finance_card_expenses", cardExpenses);
  save("finance_general_expenses", generalExpenses);
  save("finance_incomes", incomes);
  save("finance_goals", goals);
}

const now = new Date();
const cMonth = now.getMonth(), cYear = now.getFullYear();
function byMonth(arr, y, m) { return arr.filter(e => { const d = new Date(e.date); return d.getFullYear() === y && d.getMonth() === m; }); }
function sumByMonth(arr, y, m) { return byMonth(arr, y, m).reduce((s, e) => s + e.value, 0); }
// ==================== MODALS ====================
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
});


// ==================== NAVIGATION ====================
let currentPage = 'dashboard';
document.querySelectorAll('.sidebar a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const page = a.dataset.page;
    navigateTo(page);
  });
});
function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + page).classList.remove('hidden');
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  renderCurrentPage();
}


// ==================== SALARY ====================
function startEditSalary() {
  const sal = getSalary();
  document.getElementById('salary-input').value = sal > 0 ? sal : '';
  document.getElementById('salary-display').classList.add('hidden');
  document.getElementById('salary-edit').classList.remove('hidden');
  document.getElementById('salary-input').focus();
}

function saveSalary() {
  const v = parseFloat(document.getElementById('salary-input').value);
  if (isNaN(v) || v < 0) return;
  const mk = `${cYear}-${cMonth}`;
  const existing = incomes.find(i => i.type === 'salary' && (() => { const d = new Date(i.date); return `${d.getFullYear()}-${d.getMonth()}`; })() === mk);
  if (existing) { existing.value = v; } else { incomes.push({ id: uuid(), name: 'Salário', value: v, type: 'salary', date: now.toISOString() }); }
  persist();
  document.getElementById('salary-display').classList.remove('hidden');
  document.getElementById('salary-edit').classList.add('hidden');
  renderDashboard();
}

function getSalary() {
  const s = incomes.find(i => i.type === 'salary' && (() => { const d = new Date(i.date); return d.getFullYear() === cYear && d.getMonth() === cMonth; })());
  return s ? s.value : 0;
}

document.getElementById('salary-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveSalary(); });


// ==================== EXTRA INCOME ====================
function addExtraIncome() {
  const name = document.getElementById('extra-name').value.trim();
  const v = parseFloat(document.getElementById('extra-value').value);
  if (!name || isNaN(v) || v <= 0) return;
  incomes.push({ id: uuid(), name, value: v, type: 'extra', date: now.toISOString() });
  persist();
  document.getElementById('extra-name').value = '';
  document.getElementById('extra-value').value = '';
  closeModal('extra-modal');
  renderDashboard();
}

function removeIncome(id) {
  incomes = incomes.filter(i => i.id !== id);
  persist();
  renderDashboard();
}


// ==================== CARD EXPENSES ====================
function addCardExpense() {
  const name = document.getElementById('card-name').value.trim();
  const v = parseFloat(document.getElementById('card-value').value);
  const cat = document.getElementById('card-category').value;
  if (!name || isNaN(v) || v <= 0) return;
  cardExpenses.push({ id: uuid(), name, category: cat, value: v, date: new Date().toISOString() });
  persist();
  document.getElementById('card-name').value = '';
  document.getElementById('card-value').value = '';
  closeModal('card-modal');
  renderCurrentPage();
}

function removeCardExpense(id) {
  cardExpenses = cardExpenses.filter(e => e.id !== id);
  persist();
  renderCurrentPage();
}


// ==================== GENERAL EXPENSES ====================
function addGeneralExpense() {
  const name = document.getElementById('exp-name').value.trim();
  const v = parseFloat(document.getElementById('exp-value').value);
  const cat = document.getElementById('exp-category').value;
  if (!name || isNaN(v) || v <= 0) return;
  generalExpenses.push({ id: uuid(), name, category: cat, value: v, date: new Date().toISOString() });
  persist();
  document.getElementById('exp-name').value = '';
  document.getElementById('exp-value').value = '';
  closeModal('expenses-modal');
  renderCurrentPage();
}

function removeGeneralExpense(id) {
  generalExpenses = generalExpenses.filter(e => e.id !== id);
  persist();
  renderCurrentPage();
}


// ==================== GOALS ====================
function generateSuggestions(title) {
  const lower = title.toLowerCase();
  const tips = [];
  if (lower.match(/emerg[eê]ncia|reserva/)) tips.push("Defina uma meta de 3 a 6 meses de despesas fixas como reserva de emergência.","Automatize uma transferência mensal para uma conta separada assim que receber o salário.","Comece guardando pelo menos 10% da renda mensal e aumente gradativamente.","Evite usar a reserva para compras não essenciais.");
  if (lower.match(/economizar|poupar|guardar|economia/)) tips.push("Revise assinaturas e serviços recorrentes — cancele o que não usa.","Adote a regra 50-30-20: 50% necessidades, 30% desejos, 20% poupança.","Substitua refeições fora por marmitas pelo menos 3x por semana.","Use o método do envelope digital: separe o dinheiro por categoria no início do mês.");
  if (lower.match(/d[ií]vida|pagar|quitar/)) tips.push("Liste todas as dívidas por taxa de juros e priorize as mais caras.","Negocie com credores — muitos oferecem descontos para pagamento à vista.","Evite contrair novas dívidas enquanto estiver quitando as atuais.","Considere consolidar dívidas em uma com juros menores.");
  if (lower.match(/investir|investimento|rendimento|aplicar/)) tips.push("Comece com renda fixa (CDB, Tesouro Direto) antes de partir para renda variável.","Nunca invista dinheiro que pode precisar em menos de 6 meses.","Diversifique: não coloque tudo em um único tipo de investimento.","Estude sobre juros compostos — o tempo é seu maior aliado.");
  if (lower.match(/comprar|carro|casa|apartamento|viagem|viajar/)) tips.push("Defina o valor total e divida em parcelas mensais até a data desejada.","Crie uma conta separada para esse objetivo específico.","Pesquise e compare preços antes de fechar qualquer compra grande.","Considere se é mais vantajoso comprar à vista ou parcelado.");
  if (lower.match(/sal[aá]rio|renda|ganhar mais/)) tips.push("Invista em qualificação: cursos e certificações aumentam o potencial de renda.","Considere fontes de renda extra como freelance.","Negocie seu salário atual com dados de mercado.","Automatize tarefas para liberar tempo para projetos mais lucrativos.");
  if (tips.length === 0) tips.push("Defina um valor específico e um prazo realista para alcançar essa meta.","Divida a meta em etapas menores e comemore cada conquista parcial.","Acompanhe o progresso semanalmente para manter a motivação.","Corte pelo menos um gasto supérfluo por mês e redirecione para a meta.");
  return tips;
}

function addGoal() {
  const title = document.getElementById('goal-title').value.trim();
  const notes = document.getElementById('goal-notes').value.trim();
  if (!title) return;
  const suggestions = generateSuggestions(title).map(text => ({ id: uuid(), text, timestamp: new Date().toISOString() }));
  goals.unshift({ id: uuid(), title, notes, suggestions, createdAt: new Date().toISOString() });
  persist();
  document.getElementById('goal-title').value = '';
  document.getElementById('goal-notes').value = '';
  closeModal('goal-modal');
  expandedGoalId = goals[0].id;
  renderGoals();
}

function removeGoal(id) {
  goals = goals.filter(g => g.id !== id);
  persist();
  if (expandedGoalId === id) expandedGoalId = null;
  renderGoals();
}

function addMoreSuggestions(id) {
  const g = goals.find(x => x.id === id);
  if (!g) return;
  const newSugs = generateSuggestions(g.title).map(text => ({ id: uuid(), text, timestamp: new Date().toISOString() }));
  g.suggestions = [...g.suggestions, ...newSugs];
  persist();
  renderGoals();
}

let expandedGoalId = null;
function toggleGoal(id) { expandedGoalId = expandedGoalId === id ? null : id; renderGoals(); }


// ==================== CALENDAR ====================
let calYear = cYear, calMonth = cMonth;
function renderCalendar() {
  const container = document.getElementById('calendar-container');
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays = new Date(calYear, calMonth, 0).getDate();
  const labels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let html = `<div class="cal-header">
    <button class="cal-nav" onclick="calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendar()">‹</button>
    <span>${MONTHS[calMonth]} ${calYear}</span>
    <button class="cal-nav" onclick="calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendar()">›</button>
  </div><div class="cal-grid">`;
  labels.forEach(l => { html += `<div class="day-label">${l}</div>`; });
  for (let i = 0; i < firstDay; i++) html += `<div class="day outside">${prevDays - firstDay + 1 + i}</div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate() && calMonth === cMonth && calYear === cYear;
    html += `<div class="day${isToday ? ' today' : ''}">${d}</div>`;
  }
  const remaining = 7 - ((firstDay + daysInMonth) % 7);
  if (remaining < 7) for (let i = 1; i <= remaining; i++) html += `<div class="day outside">${i}</div>`;
  html += '</div>';
  container.innerHTML = html;
}


// ==================== RENDER FUNCTIONS ====================
function renderDashboard() {
  document.getElementById('dash-subtitle').textContent = `Visão geral de ${MONTHS[cMonth]} ${cYear}`;
  const cardTotal = sumByMonth(cardExpenses, cYear, cMonth);
  const expTotal = sumByMonth(generalExpenses, cYear, cMonth);
  const totalGastos = cardTotal + expTotal;
  const salary = getSalary();
  const extras = byMonth(incomes.filter(i => i.type === 'extra'), cYear, cMonth);
  const totalIncome = byMonth(incomes, cYear, cMonth).reduce((s, i) => s + i.value, 0);
  const saldo = totalIncome - totalGastos;

  // Salary button
  const salBtn = document.getElementById('salary-btn');
  salBtn.textContent = salary > 0 ? `R$ ${fmt(salary)}` : 'Definir salário';

  // Extra incomes
  let extraHtml = '';
  extras.forEach(inc => {
    extraHtml += `<div class="sep-row"><span class="label">${inc.name}</span><div style="display:flex;align-items:center;gap:8px"><span class="val text-cyan">+R$ ${fmt(inc.value)}</span><button class="delete-btn" onclick="removeIncome('${inc.id}')">✕</button></div></div>`;
  });
  document.getElementById('extra-incomes-list').innerHTML = extraHtml;
  document.getElementById('total-income').textContent = `R$ ${fmt(totalIncome)}`;
  document.getElementById('saldo').textContent = `R$ ${fmt(saldo)}`;
  document.getElementById('saldo').style.color = saldo >= 0 ? 'var(--green)' : 'var(--pink)';
  document.getElementById('dash-total-gastos').textContent = `R$ ${fmt(totalGastos)}`;
  document.getElementById('dash-card-total').textContent = `R$ ${fmt(cardTotal)}`;
  document.getElementById('dash-expenses-total').textContent = `R$ ${fmt(expTotal)}`;

  // Recent transactions
  const all = [
    ...byMonth(cardExpenses, cYear, cMonth).map(e => ({ ...e, source: 'Cartão' })),
    ...byMonth(generalExpenses, cYear, cMonth).map(e => ({ ...e, source: 'Gasto' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const txEl = document.getElementById('recent-transactions');
  if (all.length === 0) { txEl.innerHTML = '<div class="empty">Nenhuma transação neste mês.</div>'; }
  else { txEl.innerHTML = all.map(tx => `<div class="list-item"><div><span class="name">${tx.name}</span><br><span class="sub">${tx.category} · ${tx.source}</span></div><span class="amount text-pink">-R$ ${fmt(tx.value)}</span></div>`).join(''); }
  renderCalendar();
}

function renderCard() {
  const expenses = byMonth(cardExpenses, cYear, cMonth);
  const total = sumByMonth(cardExpenses, cYear, cMonth);
  document.getElementById('card-month-label').textContent = `Fatura ${MONTHS[cMonth]}`;
  document.getElementById('card-total-value').textContent = `R$ ${fmt(total)}`;
  document.getElementById('card-list-title').textContent = `Gastos do Cartão — ${MONTHS[cMonth]}`;
  const el = document.getElementById('card-expenses-list');
  if (expenses.length === 0) { el.innerHTML = '<div class="empty">Nenhum gasto registrado neste mês.</div>'; }
  else { el.innerHTML = expenses.map(e => `<div class="list-item"><div><span class="name">${e.name}</span><br><span class="sub">${e.category}</span></div><div class="right"><span class="amount text-pink">-R$ ${fmt(e.value)}</span><button class="delete-btn" onclick="removeCardExpense('${e.id}')">🗑</button></div></div>`).join(''); }
}

function renderExpenses() {
  const expenses = byMonth(generalExpenses, cYear, cMonth);
  const total = sumByMonth(generalExpenses, cYear, cMonth);
  document.getElementById('expenses-month-label').textContent = `Total Gastos — ${MONTHS[cMonth]}`;
  document.getElementById('expenses-total-value').textContent = `R$ ${fmt(total)}`;
  document.getElementById('expenses-list-title').textContent = `Gastos Gerais — ${MONTHS[cMonth]}`;
  const el = document.getElementById('general-expenses-list');
  if (expenses.length === 0) { el.innerHTML = '<div class="empty">Nenhum gasto registrado neste mês.</div>'; }
  else { el.innerHTML = expenses.map(e => `<div class="list-item"><div><span class="name">${e.name}</span><br><span class="sub">${e.category}</span></div><div class="right"><span class="amount text-pink">-R$ ${fmt(e.value)}</span><button class="delete-btn" onclick="removeGeneralExpense('${e.id}')">🗑</button></div></div>`).join(''); }
}

function renderGoals() {
  const el = document.getElementById('goals-list');
  if (goals.length === 0) {
    el.innerHTML = '<div class="card"><div class="empty">🎯<br>Nenhuma meta criada ainda. Clique em "Nova Meta" para começar.</div></div>';
    return;
  }
  el.innerHTML = goals.map(g => {
    const isOpen = expandedGoalId === g.id;
    return `<div class="goal-card">
      <button class="goal-header" onclick="toggleGoal('${g.id}')">
        <span class="text-yellow">🎯</span>
        <div class="goal-title"><p>${g.title}</p>${g.notes ? `<span class="goal-notes">${g.notes}</span>` : ''}</div>
        <span class="goal-date">${new Date(g.createdAt).toLocaleDateString('pt-BR')}</span>
        <span class="chevron">${isOpen ? '▾' : '▸'}</span>
      </button>
      ${isOpen ? `<div class="goal-body">
        <div class="suggestions-header">
          <h4>✨ Sugestões</h4>
          <div style="display:flex;gap:12px">
            <button class="link-btn" onclick="addMoreSuggestions('${g.id}')">+ Mais sugestões</button>
            <button class="link-btn link-btn-danger" onclick="removeGoal('${g.id}')">🗑 Remover</button>
          </div>
        </div>
        ${g.suggestions.map((s, i) => `<div class="suggestion-item"><span class="num">${i + 1}.</span><span>${s.text}</span></div>`).join('')}
      </div>` : ''}
    </div>`;
  }).join('');
}

function renderReports() {
  const allExp = [...cardExpenses, ...generalExpenses];
  const monthSet = new Set(allExp.map(e => { const d = new Date(e.date); return `${d.getFullYear()}-${d.getMonth()}`; }));
  const months = Array.from(monthSet).map(s => { const [y, m] = s.split('-').map(Number); return { year: y, month: m }; }).sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
  const el = document.getElementById('reports-content');
  if (months.length === 0) { el.innerHTML = '<div class="card"><div class="empty">📈<br>Nenhum dado registrado ainda. Adicione gastos no Cartão ou em Gastos.</div></div>'; return; }
  // Simple bar chart
  const chartData = [...months].reverse();
  const maxVal = Math.max(...chartData.map(m => sumByMonth(cardExpenses, m.year, m.month) + sumByMonth(generalExpenses, m.year, m.month)), 1);
  let chartHtml = '<div class="card"><div class="card-title">Comparativo Mensal</div><div class="chart-bar-container">';
  chartData.forEach(m => {
    const cV = sumByMonth(cardExpenses, m.year, m.month);
    const gV = sumByMonth(generalExpenses, m.year, m.month);
    const cH = Math.max((cV / maxVal) * 160, 4);
    const gH = Math.max((gV / maxVal) * 160, 4);
    chartHtml += `<div class="chart-bar-group"><div class="chart-bars"><div class="chart-bar" style="height:${cH}px;background:var(--blue)"></div><div class="chart-bar" style="height:${gH}px;background:var(--pink)"></div></div><span class="chart-label">${MONTHS_SHORT[m.month]}</span></div>`;
  });
  chartHtml += '</div><div style="display:flex;gap:16px;justify-content:center;margin-top:12px;font-size:0.7rem;color:var(--muted-fg)"><span>🔵 Cartão</span><span>🔴 Gastos</span></div></div>';
  let reportsHtml = chartHtml;
  months.forEach(m => {
    const cExp = byMonth(cardExpenses, m.year, m.month);
    const gExp = byMonth(generalExpenses, m.year, m.month);
    const cT = sumByMonth(cardExpenses, m.year, m.month);
    const gT = sumByMonth(generalExpenses, m.year, m.month);
    reportsHtml += `<div class="card report-month"><div class="month-header"><h3>${MONTHS[m.month]} ${m.year}</h3><span class="text-pink" style="font-size:0.875rem;font-weight:700">Total: R$ ${fmt(cT + gT)}</span></div>
    <div class="report-cols">
      <div><div class="col-label text-blue">Cartão — R$ ${fmt(cT)}</div>${cExp.length === 0 ? '<span style="font-size:0.75rem;color:var(--muted-fg)">Sem gastos</span>' : cExp.map(e => `<div class="row"><span class="rname">${e.name} (${e.category})</span><span class="rval">R$ ${fmt(e.value)}</span></div>`).join('')}</div>
      <div><div class="col-label text-pink">Gastos — R$ ${fmt(gT)}</div>${gExp.length === 0 ? '<span style="font-size:0.75rem;color:var(--muted-fg)">Sem gastos</span>' : gExp.map(e => `<div class="row"><span class="rname">${e.name} (${e.category})</span><span class="rval">R$ ${fmt(e.value)}</span></div>`).join('')}</div>
    </div></div>`;
  });
  el.innerHTML = reportsHtml;
}

function renderCurrentPage() {
  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'cartao') renderCard();
  else if (currentPage === 'gastos') renderExpenses();
  else if (currentPage === 'metas') renderGoals();
  else if (currentPage === 'relatorios') renderReports();
}

// Initial render
renderDashboard();