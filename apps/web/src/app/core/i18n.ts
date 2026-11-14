import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'sw';

const EN = {
  // common
  'common.save': 'Save', 'common.cancel': 'Cancel', 'common.close': 'Close', 'common.edit': 'Edit', 'common.add': 'Add',
  'common.search': 'Search…', 'common.all': 'All', 'common.name': 'Name', 'common.phone': 'Phone', 'common.email': 'Email',
  'common.notes': 'Notes', 'common.date': 'Date', 'common.amount': 'Amount', 'common.total': 'Total', 'common.status': 'Status',
  'common.optional': 'optional', 'common.required': 'Please fill in the required fields.', 'common.none': 'None',
  'common.reason': 'Reason', 'common.reasonRequired': 'A reason is required.', 'common.by': 'By', 'common.view': 'View',
  'common.method': 'Payment method', 'common.qty': 'Qty', 'common.price': 'Price', 'common.cost': 'Cost', 'common.unit': 'Unit',
  'common.category': 'Category', 'common.customer': 'Customer', 'common.supplier': 'Supplier', 'common.product': 'Product',
  'common.items': 'items', 'common.voided': 'Voided', 'common.void': 'Void', 'common.noResults': 'No records match your filters.',
  'common.subtotal': 'Subtotal', 'common.remove': 'Remove', 'common.details': 'Details', 'common.created': 'Created',
  'common.yes': 'Yes', 'common.no': 'No', 'common.selectOne': 'Select…', 'common.number': 'No.', 'common.when': 'When',
  'common.prototype': 'Prototype · sample data saved in this browser',
  'common.vsLastMonth': 'vs last month', 'common.itemsCol': 'Items', 'sales.onlyN': 'Only {n} in stock',

  'pm.CASH': 'Cash', 'pm.MOBILE': 'Mobile money', 'pm.BANK': 'Bank', 'pm.CARD': 'Card',
  'unit.piece': 'piece', 'unit.kg': 'kg', 'unit.litre': 'litre', 'unit.pack': 'pack', 'unit.box': 'box', 'unit.tray': 'tray',
  'unit.bottle': 'bottle', 'unit.bag': 'bag', 'unit.metre': 'metre',
  'role.OWNER': 'Owner', 'role.MANAGER': 'Manager', 'role.CASHIER': 'Cashier', 'role.INVENTORY': 'Inventory officer', 'role.EMPLOYEE': 'Employee',
  'bt.retail': 'Retail shop', 'bt.wholesale': 'Wholesale', 'bt.hospitality': 'Restaurant or hotel', 'bt.services': 'Professional services',
  'bt.personal': 'Personal services (salon, tailoring)', 'bt.other': 'Other',
  'status.PAID': 'Paid', 'status.PARTIAL': 'Partial', 'status.UNPAID': 'Unpaid', 'status.VOIDED': 'Voided',

  // nav
  'nav.overview': 'Overview', 'nav.sales': 'Sales', 'nav.purchases': 'Purchases', 'nav.expenses': 'Expenses',
  'nav.products': 'Products', 'nav.inventory': 'Inventory', 'nav.customers': 'Customers', 'nav.suppliers': 'Suppliers',
  'nav.reports': 'Reports', 'nav.team': 'Team', 'nav.audit': 'Audit log', 'nav.settings': 'Settings', 'nav.signOut': 'Sign out',
  'nav.sec.daily': 'Daily work', 'nav.sec.records': 'Records', 'nav.sec.insights': 'Insights', 'nav.sec.business': 'Business',
  'nav.more': 'More', 'nav.switchOrg': 'Switch business', 'nav.yourBusinesses': 'Your businesses',
  'ui.theme': 'Toggle dark mode', 'ui.lang': 'Switch language',

  // errors
  'err.forbidden': "You don't have permission to do that.", 'err.session': 'Your session has ended. Please sign in again.',
  'err.invalidLine': 'Check quantities and prices — they must be positive numbers.', 'err.generic': 'Something went wrong.',
  'forbidden.title': 'No access', 'forbidden.body': "Your role ({role}) can't open this page. Ask the business owner for access.",

  // auth
  'auth.welcome': 'Welcome back', 'auth.welcomeHint': 'Sign in to manage your business.',
  'auth.create': 'Create your business', 'auth.createHint': 'Set up TBMS for your business in under a minute.',
  'auth.email': 'Email', 'auth.password': 'Password', 'auth.name': 'Your name', 'auth.org': 'Business name', 'auth.bizType': 'Type of business',
  'auth.signIn': 'Sign in', 'auth.signUp': 'Create account', 'auth.show': 'Show', 'auth.hide': 'Hide',
  'auth.noAccount': 'New to TBMS?', 'auth.haveAccount': 'Already have an account?', 'auth.toSignUp': 'Create an account', 'auth.toSignIn': 'Sign in',
  'auth.pwHint': 'At least 8 characters', 'auth.failed': 'Invalid email or password.', 'auth.taken': 'That email is already registered.',
  'auth.noOrg': 'This account is not a member of any business.', 'auth.fillAll': 'Fill in all fields to continue.',
  'auth.pitch': 'Sales, stock, customers and expenses — one calm workspace built for Tanzanian businesses.',
  'auth.f1': 'Every figure in TZS, kept to the shilling', 'auth.f2': 'Works on phone, tablet and desktop', 'auth.f3': 'Kiswahili and English',
  'auth.demo': 'Try a demo account', 'auth.demoHint': 'Password for all demo accounts: demo1234', 'auth.twoBiz': '2 businesses',

  // dashboard
  'greet.morning': 'Good morning', 'greet.afternoon': 'Good afternoon', 'greet.evening': 'Good evening',
  'dash.subtitle': "Here's where {org} stands today.",
  'dash.profit': 'Estimated profit · this month', 'dash.profitHint': 'Revenue − cost of goods − expenses', 'dash.margin': 'margin',
  'dash.todaySales': "Today's sales", 'dash.todayHint': '{n} sales recorded today',
  'dash.revenue': 'Revenue', 'dash.expenses': 'Expenses', 'dash.receivables': 'Owed to you', 'dash.lowStock': 'Low stock',
  'dash.thisMonth': 'This month', 'dash.customersOwing': '{n} customers', 'dash.atReorder': 'at or below reorder level',
  'dash.salesToday': 'Sales today', 'dash.itemsToday': 'Items sold today', 'dash.customers': 'Customers', 'dash.onRecord': 'on record',
  'dash.cashflow': 'Cash flow', 'dash.cashflowHint': 'Revenue and expenses, last 6 months',
  'dash.table': 'Table', 'dash.chart': 'Chart', 'dash.month': 'Month', 'dash.netShort': 'Net',
  'dash.noData': 'No sales or expenses in the last 6 months yet.',
  'dash.quick': 'Quick actions', 'dash.quickHint': 'Keep your records up to date',
  'dash.recordSale': 'Record a sale', 'dash.recordSaleHint': 'Capture a completed sale',
  'dash.addExpense': 'Add an expense', 'dash.addExpenseHint': 'Log an operating cost',
  'dash.addProduct': 'Add a product', 'dash.addProductHint': 'Grow your catalog',
  'dash.recordPurchase': 'Receive stock', 'dash.recordPurchaseHint': 'Record a supplier purchase',
  'dash.activity': 'Recent activity', 'dash.activityEmpty': 'Changes you and your team make will appear here.', 'dash.seeAll': 'See all',
  'dash.lowStockTitle': 'Running low', 'dash.lowStockEmpty': 'All products are above their reorder level.', 'dash.left': '{n} left',
  'dash.attention': 'Needs your attention', 'dash.attOverdue': '{n} customers owe {amount} for over 30 days', 'dash.attLow': '{n} products are running low', 'dash.attBills': '{n} supplier bills unpaid · {amount}', 'dash.attClear': 'All clear — nothing needs you right now.', 'dash.topMonth': 'Best sellers this month', 'dash.soFar': 'so far', 'dash.partialNote': '{month} is month-to-date (dashed)', 'dash.view': 'View',
  'dash.setup': 'Get set up', 'dash.setupHint': 'A few steps to bring your business into TBMS',
  'dash.step.product': 'Add your first product', 'dash.step.customer': 'Add a customer',
  'dash.step.sale': 'Record your first sale', 'dash.step.expense': 'Log an expense', 'dash.step.team': 'Invite a team member',

  // sales
  'sales.title': 'Sales', 'sales.subtitle': 'Record sales and track who still owes you', 'sales.new': 'New sale',
  'sales.number': 'Sale', 'sales.walkIn': 'Walk-in customer', 'sales.paid': 'Paid', 'sales.balance': 'Balance',
  'sales.filter.owing': 'Owing', 'sales.addItem': 'Add item', 'sales.pickProduct': 'Search products by name or SKU…',
  'sales.inStock': '{n} in stock', 'sales.notEnough': 'Not enough {name} in stock (only {n}).',
  'sales.amountPaid': 'Amount paid now', 'sales.full': 'Paid in full', 'sales.credit': 'On credit',
  'sales.needCustomer': 'Choose a customer for credit or part-paid sales.', 'sales.noLines': 'Add at least one item.',
  'sales.complete': 'Complete sale', 'sales.recorded': 'Sale {ref} recorded', 'sales.duplicate': 'That sale was already recorded — no duplicate created.',
  'sales.recordPayment': 'Record payment', 'sales.paymentRecorded': 'Payment recorded', 'sales.badPayment': 'Enter an amount between 1 and {max}.',
  'sales.voidTitle': 'Void this sale?', 'sales.voidHint': 'The original stays on record. Stock goes back and the sale no longer counts as revenue.',
  'sales.voided': 'Sale voided', 'sales.payments': 'Payments', 'sales.lines': 'Items', 'sales.noPayments': 'No payments yet.',
  'sales.empty': 'No sales yet. Record your first sale to see it here.', 'sales.change': 'Balance due', 'sales.customerHint': 'Needed for credit',
  'sales.nothingFound': 'No products match.', 'sales.outOfStock': 'Out of stock', 'sales.stockOff': 'Inventory tracking is off — stock is not checked.',

  // purchases
  'pur.title': 'Purchases', 'pur.subtitle': 'Stock received from suppliers', 'pur.new': 'Receive stock', 'pur.number': 'Purchase',
  'pur.unitCost': 'Unit cost', 'pur.recorded': 'Purchase {ref} saved — stock updated', 'pur.complete': 'Save purchase',
  'pur.paidNow': 'Paid to supplier now', 'pur.updateCost': "Update each product's cost price to this cost",
  'pur.markPaid': 'Mark as paid', 'pur.markedPaid': 'Marked as paid', 'pur.unpaid': 'Not yet paid', 'pur.paidLabel': 'Paid',
  'pur.voidTitle': 'Void this purchase?', 'pur.voidHint': 'The stock it added is removed. The original stays on record.',
  'pur.voidBlocked': "Can't void: some of this stock has already been sold.", 'pur.voided': 'Purchase voided',
  'pur.empty': 'No purchases yet. Receive stock from a supplier to add it to inventory.', 'pur.owed': 'You owe suppliers',

  // products
  'prod.title': 'Products', 'prod.subtitle': 'Your catalog, prices and units', 'prod.new': 'New product', 'prod.edit': 'Edit product',
  'prod.sku': 'SKU', 'prod.reorder': 'Reorder level', 'prod.trackStock': 'Track stock for this product',
  'prod.saved': 'Product saved', 'prod.skuTaken': 'That SKU is already used by another product.', 'prod.margin': 'Margin',
  'prod.stock': 'Stock', 'prod.newCategory': 'New category', 'prod.categoryAdded': 'Category added', 'prod.empty': 'No products yet.',
  'prod.inactive': 'Inactive', 'prod.active': 'Active — available for sale', 'prod.openingStock': 'Opening stock', 'prod.uncategorised': 'Uncategorised',
  'prod.priceSell': 'Selling price', 'prod.priceCost': 'Cost price',

  // inventory
  'inv.title': 'Inventory', 'inv.subtitle': 'Stock levels and every movement behind them', 'inv.levels': 'Stock levels', 'inv.movements': 'Movements',
  'inv.adjust': 'Adjust stock', 'inv.adjustHint': 'Use for damage, loss or stock-count corrections. Every adjustment is recorded with its reason.',
  'inv.change': 'Change', 'inv.add': 'Add', 'inv.removeQty': 'Remove', 'inv.newLevel': 'New level', 'inv.adjusted': 'Stock adjusted',
  'inv.low': 'Low', 'inv.out': 'Out', 'inv.ok': 'OK', 'inv.value': 'Stock value at cost', 'inv.zero': 'Enter a quantity other than zero.',
  'inv.disabled': 'Inventory tracking is turned off for this business.', 'inv.enableInSettings': 'Turn it on in Settings',
  'inv.negative': "Stock can't go below zero.", 'inv.onHand': 'On hand', 'inv.source': 'Source',
  'inv.reason.damage': 'Damaged', 'inv.reason.loss': 'Lost or stolen', 'inv.reason.count': 'Stock count correction',
  'inv.reason.expired': 'Expired', 'inv.reason.other': 'Other', 'inv.noteHint': 'Add detail (optional)',
  'mv.OPENING': 'Opening stock', 'mv.PURCHASE': 'Purchase', 'mv.SALE': 'Sale', 'mv.ADJUSTMENT': 'Adjustment', 'mv.VOID': 'Reversal',

  // contacts
  'cus.title': 'Customers', 'cus.subtitle': 'People and businesses you sell to', 'cus.new': 'New customer', 'cus.edit': 'Edit customer',
  'cus.owes': 'Owes', 'cus.totalBought': 'Total bought', 'cus.last': 'Last sale', 'cus.saved': 'Customer saved', 'cus.empty': 'No customers yet.',
  'sup.title': 'Suppliers', 'sup.subtitle': 'Where your stock comes from', 'sup.new': 'New supplier', 'sup.edit': 'Edit supplier',
  'sup.totalBought': 'Total purchased', 'sup.last': 'Last purchase', 'sup.saved': 'Supplier saved', 'sup.empty': 'No suppliers yet.',
  'sup.owed': 'You owe',
  'contact.history': 'History', 'contact.noHistory': 'No transactions yet.',

  // expenses
  'exp.title': 'Expenses', 'exp.subtitle': 'Operating costs by category', 'exp.new': 'New expense', 'exp.recorded': 'Expense recorded',
  'exp.voidTitle': 'Void this expense?', 'exp.voidHint': 'The original stays on record and is excluded from reports.', 'exp.voided': 'Expense voided',
  'exp.empty': 'No expenses yet.', 'exp.badAmount': 'Enter an amount greater than zero.', 'exp.thisMonth': 'This month', 'exp.lastMonth': 'Last month',
  'exp.newCategory': '+ New category', 'exp.categoryName': 'Category name',

  // reports
  'rep.title': 'Reports', 'rep.subtitle': 'Revenue, costs, money owed and profit — each shown separately',
  'per.today': 'Today', 'per.thisMonth': 'This month', 'per.lastMonth': 'Last month', 'per.last90': 'Last 90 days', 'per.thisYear': 'This year',
  'rep.pl': 'Profit & loss (estimated)', 'rep.revenue': 'Revenue (sales)', 'rep.cogs': 'Cost of goods sold', 'rep.gross': 'Gross profit',
  'rep.opex': 'Operating expenses', 'rep.net': 'Net profit (estimated)', 'rep.cash': 'Cash vs credit', 'rep.received': 'Received from these sales',
  'rep.onCredit': 'Still owed from these sales', 'rep.receivables': 'Who owes you (all time)', 'rep.topProducts': 'Top products',
  'rep.unitsSold': 'sold', 'rep.expByCat': 'Expenses by category', 'rep.cogsNote': "Cost of goods uses each product's current cost price.",
  'rep.noReceivables': 'Nobody owes you money.', 'rep.oldest': 'Oldest unpaid', 'rep.daysAgo': '{n} days ago', 'rep.print': 'Print',
  'rep.salesCount': '{n} sales', 'rep.liabilities': 'Owed to suppliers', 'rep.nothing': 'Nothing recorded in this period.',

  // team
  'team.title': 'Team', 'team.subtitle': 'Who can access this business, and what each role can do', 'team.invite': 'Add member',
  'team.role': 'Role', 'team.you': 'You', 'team.added': 'Member added', 'team.roleChanged': 'Role updated', 'team.remove': 'Remove',
  'team.removed': 'Member removed', 'team.lastOwner': 'A business needs at least one owner.', 'team.matrix': 'What each role can do',
  'team.exists': 'That person is already a member.', 'team.notSelf': "You can't remove yourself.",
  'team.inviteHint': 'In the real app they receive an email invitation. In this prototype they can sign in with password demo1234.',
  'team.removeConfirm': 'Remove {name} from this business? Their past records stay.', 'team.since': 'Member since',
  'perm.sales': 'Record sales', 'perm.payments': 'Record customer payments', 'perm.void': 'Void transactions', 'perm.purchases': 'Receive stock',
  'perm.products': 'Manage products', 'perm.inventory': 'Adjust stock', 'perm.customers': 'Manage customers', 'perm.suppliers': 'Manage suppliers',
  'perm.expenses': 'Record expenses', 'perm.reports': 'See financial reports', 'perm.team': 'Manage team', 'perm.settings': 'Business settings',
  'perm.audit': 'View audit log',

  // audit
  'audit.title': 'Audit log', 'audit.subtitle': 'Every important change — who made it and when', 'audit.actor': 'User', 'audit.event': 'Event',
  'audit.empty': 'No events yet.', 'audit.filterUser': 'All users',
  'a.sale.create': 'Recorded sale {ref} · {amount}', 'a.sale.payment': 'Received {amount} for {ref}',
  'a.sale.void': 'Voided sale {ref} ({amount}) — {reason}', 'a.purchase.create': 'Received stock {ref} · {amount}',
  'a.purchase.paid': 'Paid supplier for {ref} · {amount}', 'a.purchase.void': 'Voided purchase {ref} ({amount}) — {reason}',
  'a.expense.create': 'Recorded expense: {ref} · {amount}', 'a.expense.void': 'Voided expense: {ref} ({amount}) — {reason}',
  'a.product.create': 'Added product {ref}', 'a.product.update': 'Updated product {ref}', 'a.stock.adjust': 'Adjusted {ref} by {qty} — {reason}',
  'a.customer.create': 'Added customer {ref}', 'a.customer.update': 'Updated customer {ref}',
  'a.supplier.create': 'Added supplier {ref}', 'a.supplier.update': 'Updated supplier {ref}',
  'a.member.add': 'Added {ref} as {role}', 'a.member.role': 'Changed {ref} to {role}', 'a.member.remove': 'Removed {ref} from the team',
  'a.org.create': 'Created business {ref}', 'a.org.update': 'Updated business settings', 'a.category.create': 'Added category {ref}',

  // settings
  'set.title': 'Settings', 'set.subtitle': 'Business profile and preferences', 'set.profile': 'Business profile', 'set.name': 'Business name',
  'set.type': 'Type of business', 'set.region': 'Region', 'set.address': 'Address', 'set.tin': 'TIN', 'set.features': 'Features',
  'set.inventory': 'Track inventory', 'set.inventoryHint': "Turn off if you sell services or don't keep stock. Sales then won't check or change stock.",
  'set.saved': 'Settings saved', 'set.demo': 'Prototype data', 'set.reset': 'Reset sample data',
  'set.demoHint': 'Everything is stored in this browser only. Resetting restores the two sample businesses and signs you out.',
  'set.resetConfirm': 'Erase every change made in this browser and restore the sample data?', 'set.readOnly': 'Only the owner can change these settings.',
};

export type I18nKey = keyof typeof EN;

// Kiswahili is a first pass — have a native speaker review before release.
const SW: Record<I18nKey, string> = {
  'common.save': 'Hifadhi', 'common.cancel': 'Ghairi', 'common.close': 'Funga', 'common.edit': 'Hariri', 'common.add': 'Ongeza',
  'common.search': 'Tafuta…', 'common.all': 'Zote', 'common.name': 'Jina', 'common.phone': 'Simu', 'common.email': 'Barua pepe',
  'common.notes': 'Maelezo', 'common.date': 'Tarehe', 'common.amount': 'Kiasi', 'common.total': 'Jumla', 'common.status': 'Hali',
  'common.optional': 'si lazima', 'common.required': 'Tafadhali jaza sehemu zinazohitajika.', 'common.none': 'Hakuna',
  'common.reason': 'Sababu', 'common.reasonRequired': 'Sababu inahitajika.', 'common.by': 'Na', 'common.view': 'Tazama',
  'common.method': 'Njia ya malipo', 'common.qty': 'Idadi', 'common.price': 'Bei', 'common.cost': 'Gharama', 'common.unit': 'Kipimo',
  'common.category': 'Kundi', 'common.customer': 'Mteja', 'common.supplier': 'Msambazaji', 'common.product': 'Bidhaa',
  'common.items': 'bidhaa', 'common.voided': 'Imebatilishwa', 'common.void': 'Batilisha', 'common.noResults': 'Hakuna rekodi zinazolingana na vichujio.',
  'common.subtotal': 'Jumla ndogo', 'common.remove': 'Ondoa', 'common.details': 'Maelezo', 'common.created': 'Imeundwa',
  'common.yes': 'Ndiyo', 'common.no': 'Hapana', 'common.selectOne': 'Chagua…', 'common.number': 'Na.', 'common.when': 'Lini',
  'common.prototype': 'Mfano · data ya majaribio imehifadhiwa kwenye kivinjari hiki',
  'common.vsLastMonth': 'dhidi ya mwezi uliopita', 'common.itemsCol': 'Bidhaa', 'sales.onlyN': 'Zipo {n} tu stoo',

  'pm.CASH': 'Taslimu', 'pm.MOBILE': 'Pesa ya simu', 'pm.BANK': 'Benki', 'pm.CARD': 'Kadi',
  'unit.piece': 'kipande', 'unit.kg': 'kg', 'unit.litre': 'lita', 'unit.pack': 'pakiti', 'unit.box': 'boksi', 'unit.tray': 'trei',
  'unit.bottle': 'chupa', 'unit.bag': 'mfuko', 'unit.metre': 'mita',
  'role.OWNER': 'Mmiliki', 'role.MANAGER': 'Meneja', 'role.CASHIER': 'Keshia', 'role.INVENTORY': 'Afisa wa stoo', 'role.EMPLOYEE': 'Mfanyakazi',
  'bt.retail': 'Duka la rejareja', 'bt.wholesale': 'Jumla', 'bt.hospitality': 'Mgahawa au hoteli', 'bt.services': 'Huduma za kitaalamu',
  'bt.personal': 'Huduma binafsi (saluni, ushonaji)', 'bt.other': 'Nyingine',
  'status.PAID': 'Imelipwa', 'status.PARTIAL': 'Sehemu', 'status.UNPAID': 'Haijalipwa', 'status.VOIDED': 'Imebatilishwa',

  'nav.overview': 'Muhtasari', 'nav.sales': 'Mauzo', 'nav.purchases': 'Manunuzi', 'nav.expenses': 'Matumizi',
  'nav.products': 'Bidhaa', 'nav.inventory': 'Stoo', 'nav.customers': 'Wateja', 'nav.suppliers': 'Wasambazaji',
  'nav.reports': 'Ripoti', 'nav.team': 'Timu', 'nav.audit': 'Kumbukumbu za ukaguzi', 'nav.settings': 'Mipangilio', 'nav.signOut': 'Toka',
  'nav.sec.daily': 'Kazi za kila siku', 'nav.sec.records': 'Kumbukumbu', 'nav.sec.insights': 'Uchambuzi', 'nav.sec.business': 'Biashara',
  'nav.more': 'Zaidi', 'nav.switchOrg': 'Badili biashara', 'nav.yourBusinesses': 'Biashara zako',
  'ui.theme': 'Badilisha mwonekano', 'ui.lang': 'Badilisha lugha',

  'err.forbidden': 'Huna ruhusa ya kufanya hivyo.', 'err.session': 'Muda wako umeisha. Tafadhali ingia tena.',
  'err.invalidLine': 'Kagua idadi na bei — lazima ziwe namba chanya.', 'err.generic': 'Kuna tatizo limetokea.',
  'forbidden.title': 'Huna ruhusa', 'forbidden.body': 'Wadhifa wako ({role}) hauwezi kufungua ukurasa huu. Muombe mmiliki wa biashara ruhusa.',

  'auth.welcome': 'Karibu tena', 'auth.welcomeHint': 'Ingia kusimamia biashara yako.',
  'auth.create': 'Sajili biashara yako', 'auth.createHint': 'Anzisha TBMS kwa biashara yako chini ya dakika moja.',
  'auth.email': 'Barua pepe', 'auth.password': 'Nenosiri', 'auth.name': 'Jina lako', 'auth.org': 'Jina la biashara', 'auth.bizType': 'Aina ya biashara',
  'auth.signIn': 'Ingia', 'auth.signUp': 'Fungua akaunti', 'auth.show': 'Onyesha', 'auth.hide': 'Ficha',
  'auth.noAccount': 'Mgeni kwenye TBMS?', 'auth.haveAccount': 'Una akaunti tayari?', 'auth.toSignUp': 'Fungua akaunti', 'auth.toSignIn': 'Ingia',
  'auth.pwHint': 'Angalau herufi 8', 'auth.failed': 'Barua pepe au nenosiri si sahihi.', 'auth.taken': 'Barua pepe hii imeshasajiliwa.',
  'auth.noOrg': 'Akaunti hii si mwanachama wa biashara yoyote.', 'auth.fillAll': 'Jaza sehemu zote ili kuendelea.',
  'auth.pitch': 'Mauzo, stoo, wateja na matumizi — sehemu moja tulivu iliyojengwa kwa biashara za Kitanzania.',
  'auth.f1': 'Kila kiasi kwa TZS, sahihi hadi shilingi', 'auth.f2': 'Inafanya kazi kwenye simu, tableti na kompyuta', 'auth.f3': 'Kiswahili na Kiingereza',
  'auth.demo': 'Jaribu akaunti ya mfano', 'auth.demoHint': 'Nenosiri kwa akaunti zote za mfano: demo1234', 'auth.twoBiz': 'biashara 2',

  'greet.morning': 'Habari za asubuhi', 'greet.afternoon': 'Habari za mchana', 'greet.evening': 'Habari za jioni',
  'dash.subtitle': 'Hali ya {org} leo.',
  'dash.profit': 'Faida inayokadiriwa · mwezi huu', 'dash.profitHint': 'Mapato − gharama ya bidhaa − matumizi', 'dash.margin': 'faida',
  'dash.todaySales': 'Mauzo ya leo', 'dash.todayHint': 'Mauzo {n} yamerekodiwa leo',
  'dash.revenue': 'Mapato', 'dash.expenses': 'Matumizi', 'dash.receivables': 'Unawadai', 'dash.lowStock': 'Stoo ya chini',
  'dash.thisMonth': 'Mwezi huu', 'dash.customersOwing': 'wateja {n}', 'dash.atReorder': 'zimefikia kiwango cha kuagiza',
  'dash.salesToday': 'Mauzo leo', 'dash.itemsToday': 'Bidhaa zilizouzwa leo', 'dash.customers': 'Wateja', 'dash.onRecord': 'waliosajiliwa',
  'dash.cashflow': 'Mtiririko wa fedha', 'dash.cashflowHint': 'Mapato na matumizi, miezi 6 iliyopita',
  'dash.table': 'Jedwali', 'dash.chart': 'Chati', 'dash.month': 'Mwezi', 'dash.netShort': 'Salio',
  'dash.noData': 'Bado hakuna mauzo wala matumizi katika miezi 6 iliyopita.',
  'dash.quick': 'Vitendo vya haraka', 'dash.quickHint': 'Weka kumbukumbu zako sawa',
  'dash.recordSale': 'Rekodi mauzo', 'dash.recordSaleHint': 'Hifadhi mauzo yaliyokamilika',
  'dash.addExpense': 'Ongeza matumizi', 'dash.addExpenseHint': 'Andika gharama ya uendeshaji',
  'dash.addProduct': 'Ongeza bidhaa', 'dash.addProductHint': 'Panua orodha yako',
  'dash.recordPurchase': 'Pokea mzigo', 'dash.recordPurchaseHint': 'Rekodi manunuzi kutoka kwa msambazaji',
  'dash.activity': 'Shughuli za karibuni', 'dash.activityEmpty': 'Mabadiliko utakayofanya wewe na timu yataonekana hapa.', 'dash.seeAll': 'Ona zote',
  'dash.lowStockTitle': 'Zinakaribia kuisha', 'dash.lowStockEmpty': 'Bidhaa zote ziko juu ya kiwango cha kuagiza.', 'dash.left': 'zimebaki {n}',
  'dash.attention': 'Inahitaji umakini wako', 'dash.attOverdue': 'Wateja {n} wanadaiwa {amount} kwa zaidi ya siku 30', 'dash.attLow': 'Bidhaa {n} zinakaribia kuisha', 'dash.attBills': 'Bili {n} za wasambazaji hazijalipwa · {amount}', 'dash.attClear': 'Kila kitu kiko sawa — hakuna kinachokuhitaji sasa.', 'dash.topMonth': 'Zinazouzwa zaidi mwezi huu', 'dash.soFar': 'hadi sasa', 'dash.partialNote': '{month} ni mwezi hadi leo (mstari wa vitone)', 'dash.view': 'Tazama',
  'dash.setup': 'Anza hapa', 'dash.setupHint': 'Hatua chache kuleta biashara yako kwenye TBMS',
  'dash.step.product': 'Ongeza bidhaa ya kwanza', 'dash.step.customer': 'Ongeza mteja',
  'dash.step.sale': 'Rekodi mauzo ya kwanza', 'dash.step.expense': 'Andika matumizi', 'dash.step.team': 'Alika mwanatimu',

  'sales.title': 'Mauzo', 'sales.subtitle': 'Rekodi mauzo na fuatilia wanaokudai', 'sales.new': 'Mauzo mapya',
  'sales.number': 'Mauzo', 'sales.walkIn': 'Mteja wa papo hapo', 'sales.paid': 'Imelipwa', 'sales.balance': 'Salio',
  'sales.filter.owing': 'Wanaodaiwa', 'sales.addItem': 'Ongeza bidhaa', 'sales.pickProduct': 'Tafuta bidhaa kwa jina au msimbo…',
  'sales.inStock': '{n} zipo stoo', 'sales.notEnough': '{name} haitoshi stoo (zipo {n} tu).',
  'sales.amountPaid': 'Kiasi kilicholipwa sasa', 'sales.full': 'Imelipwa yote', 'sales.credit': 'Kwa mkopo',
  'sales.needCustomer': 'Chagua mteja kwa mauzo ya mkopo au malipo ya sehemu.', 'sales.noLines': 'Ongeza angalau bidhaa moja.',
  'sales.complete': 'Kamilisha mauzo', 'sales.recorded': 'Mauzo {ref} yamerekodiwa', 'sales.duplicate': 'Mauzo hayo yamesharekodiwa — hakuna nakala iliyoundwa.',
  'sales.recordPayment': 'Rekodi malipo', 'sales.paymentRecorded': 'Malipo yamerekodiwa', 'sales.badPayment': 'Weka kiasi kati ya 1 na {max}.',
  'sales.voidTitle': 'Batilisha mauzo haya?', 'sales.voidHint': 'Rekodi ya awali inabaki. Bidhaa zinarudi stoo na mauzo hayahesabiwi tena kwenye mapato.',
  'sales.voided': 'Mauzo yamebatilishwa', 'sales.payments': 'Malipo', 'sales.lines': 'Bidhaa', 'sales.noPayments': 'Bado hakuna malipo.',
  'sales.empty': 'Bado hakuna mauzo. Rekodi mauzo yako ya kwanza yaonekane hapa.', 'sales.change': 'Kiasi kinachodaiwa', 'sales.customerHint': 'Inahitajika kwa mkopo',
  'sales.nothingFound': 'Hakuna bidhaa inayolingana.', 'sales.outOfStock': 'Imeisha', 'sales.stockOff': 'Ufuatiliaji wa stoo umezimwa — stoo haikaguliwi.',

  'pur.title': 'Manunuzi', 'pur.subtitle': 'Mzigo uliopokelewa kutoka kwa wasambazaji', 'pur.new': 'Pokea mzigo', 'pur.number': 'Manunuzi',
  'pur.unitCost': 'Gharama kwa kimoja', 'pur.recorded': 'Manunuzi {ref} yamehifadhiwa — stoo imesasishwa', 'pur.complete': 'Hifadhi manunuzi',
  'pur.paidNow': 'Msambazaji amelipwa sasa', 'pur.updateCost': 'Sasisha bei ya kununulia ya kila bidhaa kuwa gharama hii',
  'pur.markPaid': 'Weka kuwa imelipwa', 'pur.markedPaid': 'Imewekwa kuwa imelipwa', 'pur.unpaid': 'Bado haijalipwa', 'pur.paidLabel': 'Imelipwa',
  'pur.voidTitle': 'Batilisha manunuzi haya?', 'pur.voidHint': 'Stoo iliyoongezwa itaondolewa. Rekodi ya awali inabaki.',
  'pur.voidBlocked': 'Haiwezekani: sehemu ya mzigo huu imeshauzwa.', 'pur.voided': 'Manunuzi yamebatilishwa',
  'pur.empty': 'Bado hakuna manunuzi. Pokea mzigo kutoka kwa msambazaji ili kuuongeza stoo.', 'pur.owed': 'Unadaiwa na wasambazaji',

  'prod.title': 'Bidhaa', 'prod.subtitle': 'Orodha yako, bei na vipimo', 'prod.new': 'Bidhaa mpya', 'prod.edit': 'Hariri bidhaa',
  'prod.sku': 'Msimbo', 'prod.reorder': 'Kiwango cha kuagiza', 'prod.trackStock': 'Fuatilia stoo ya bidhaa hii',
  'prod.saved': 'Bidhaa imehifadhiwa', 'prod.skuTaken': 'Msimbo huo unatumiwa na bidhaa nyingine.', 'prod.margin': 'Faida',
  'prod.stock': 'Stoo', 'prod.newCategory': 'Kundi jipya', 'prod.categoryAdded': 'Kundi limeongezwa', 'prod.empty': 'Bado hakuna bidhaa.',
  'prod.inactive': 'Haitumiki', 'prod.active': 'Inatumika — inapatikana kwa mauzo', 'prod.openingStock': 'Stoo ya kuanzia', 'prod.uncategorised': 'Bila kundi',
  'prod.priceSell': 'Bei ya kuuzia', 'prod.priceCost': 'Bei ya kununulia',

  'inv.title': 'Stoo', 'inv.subtitle': 'Kiasi cha stoo na kila mabadiliko yake', 'inv.levels': 'Kiasi cha stoo', 'inv.movements': 'Mabadiliko',
  'inv.adjust': 'Rekebisha stoo', 'inv.adjustHint': 'Tumia kwa uharibifu, upotevu au marekebisho baada ya kuhesabu. Kila marekebisho yanahifadhiwa na sababu yake.',
  'inv.change': 'Mabadiliko', 'inv.add': 'Ongeza', 'inv.removeQty': 'Punguza', 'inv.newLevel': 'Kiwango kipya', 'inv.adjusted': 'Stoo imerekebishwa',
  'inv.low': 'Chini', 'inv.out': 'Imeisha', 'inv.ok': 'Sawa', 'inv.value': 'Thamani ya stoo (gharama)', 'inv.zero': 'Weka idadi isiyo sifuri.',
  'inv.disabled': 'Ufuatiliaji wa stoo umezimwa kwa biashara hii.', 'inv.enableInSettings': 'Uwashe kwenye Mipangilio',
  'inv.negative': 'Stoo haiwezi kuwa chini ya sifuri.', 'inv.onHand': 'Zilizopo', 'inv.source': 'Chanzo',
  'inv.reason.damage': 'Imeharibika', 'inv.reason.loss': 'Imepotea au kuibiwa', 'inv.reason.count': 'Marekebisho baada ya kuhesabu',
  'inv.reason.expired': 'Imepita muda wake', 'inv.reason.other': 'Nyingine', 'inv.noteHint': 'Ongeza maelezo (si lazima)',
  'mv.OPENING': 'Stoo ya kuanzia', 'mv.PURCHASE': 'Manunuzi', 'mv.SALE': 'Mauzo', 'mv.ADJUSTMENT': 'Marekebisho', 'mv.VOID': 'Ubatilishaji',

  'cus.title': 'Wateja', 'cus.subtitle': 'Watu na biashara unaowauzia', 'cus.new': 'Mteja mpya', 'cus.edit': 'Hariri mteja',
  'cus.owes': 'Anadaiwa', 'cus.totalBought': 'Jumla ya manunuzi', 'cus.last': 'Mauzo ya mwisho', 'cus.saved': 'Mteja amehifadhiwa', 'cus.empty': 'Bado hakuna wateja.',
  'sup.title': 'Wasambazaji', 'sup.subtitle': 'Mzigo wako unatoka wapi', 'sup.new': 'Msambazaji mpya', 'sup.edit': 'Hariri msambazaji',
  'sup.totalBought': 'Jumla ya manunuzi', 'sup.last': 'Manunuzi ya mwisho', 'sup.saved': 'Msambazaji amehifadhiwa', 'sup.empty': 'Bado hakuna wasambazaji.',
  'sup.owed': 'Unadaiwa',
  'contact.history': 'Historia', 'contact.noHistory': 'Bado hakuna miamala.',

  'exp.title': 'Matumizi', 'exp.subtitle': 'Gharama za uendeshaji kwa makundi', 'exp.new': 'Matumizi mapya', 'exp.recorded': 'Matumizi yamerekodiwa',
  'exp.voidTitle': 'Batilisha matumizi haya?', 'exp.voidHint': 'Rekodi ya awali inabaki na haihesabiwi kwenye ripoti.', 'exp.voided': 'Matumizi yamebatilishwa',
  'exp.empty': 'Bado hakuna matumizi.', 'exp.badAmount': 'Weka kiasi kikubwa kuliko sifuri.', 'exp.thisMonth': 'Mwezi huu', 'exp.lastMonth': 'Mwezi uliopita',
  'exp.newCategory': '+ Kundi jipya', 'exp.categoryName': 'Jina la kundi',

  'rep.title': 'Ripoti', 'rep.subtitle': 'Mapato, gharama, madeni na faida — kila kimoja peke yake',
  'per.today': 'Leo', 'per.thisMonth': 'Mwezi huu', 'per.lastMonth': 'Mwezi uliopita', 'per.last90': 'Siku 90 zilizopita', 'per.thisYear': 'Mwaka huu',
  'rep.pl': 'Faida na hasara (makadirio)', 'rep.revenue': 'Mapato (mauzo)', 'rep.cogs': 'Gharama ya bidhaa zilizouzwa', 'rep.gross': 'Faida ghafi',
  'rep.opex': 'Matumizi ya uendeshaji', 'rep.net': 'Faida halisi (makadirio)', 'rep.cash': 'Taslimu na mkopo', 'rep.received': 'Kilichopokelewa kutoka mauzo haya',
  'rep.onCredit': 'Bado kinadaiwa kutoka mauzo haya', 'rep.receivables': 'Wanaokudai (wote)', 'rep.topProducts': 'Bidhaa zinazoongoza',
  'rep.unitsSold': 'zimeuzwa', 'rep.expByCat': 'Matumizi kwa makundi', 'rep.cogsNote': 'Gharama ya bidhaa inatumia bei ya kununulia ya sasa ya kila bidhaa.',
  'rep.noReceivables': 'Hakuna anayekudai.', 'rep.oldest': 'Deni la zamani zaidi', 'rep.daysAgo': 'siku {n} zilizopita', 'rep.print': 'Chapisha',
  'rep.salesCount': 'mauzo {n}', 'rep.liabilities': 'Unadaiwa na wasambazaji', 'rep.nothing': 'Hakuna kilichorekodiwa katika kipindi hiki.',

  'team.title': 'Timu', 'team.subtitle': 'Nani anaweza kuingia kwenye biashara hii, na kila wadhifa unaweza kufanya nini', 'team.invite': 'Ongeza mwanatimu',
  'team.role': 'Wadhifa', 'team.you': 'Wewe', 'team.added': 'Mwanatimu ameongezwa', 'team.roleChanged': 'Wadhifa umebadilishwa', 'team.remove': 'Ondoa',
  'team.removed': 'Mwanatimu ameondolewa', 'team.lastOwner': 'Biashara inahitaji angalau mmiliki mmoja.', 'team.matrix': 'Kila wadhifa unaweza kufanya nini',
  'team.exists': 'Mtu huyo tayari ni mwanatimu.', 'team.notSelf': 'Huwezi kujiondoa mwenyewe.',
  'team.inviteHint': 'Kwenye programu halisi watapokea mwaliko kwa barua pepe. Kwenye mfano huu wanaweza kuingia kwa nenosiri demo1234.',
  'team.removeConfirm': 'Mwondoe {name} kwenye biashara hii? Rekodi zake za zamani zinabaki.', 'team.since': 'Mwanatimu tangu',
  'perm.sales': 'Kurekodi mauzo', 'perm.payments': 'Kurekodi malipo ya wateja', 'perm.void': 'Kubatilisha miamala', 'perm.purchases': 'Kupokea mzigo',
  'perm.products': 'Kusimamia bidhaa', 'perm.inventory': 'Kurekebisha stoo', 'perm.customers': 'Kusimamia wateja', 'perm.suppliers': 'Kusimamia wasambazaji',
  'perm.expenses': 'Kurekodi matumizi', 'perm.reports': 'Kuona ripoti za fedha', 'perm.team': 'Kusimamia timu', 'perm.settings': 'Mipangilio ya biashara',
  'perm.audit': 'Kuona kumbukumbu za ukaguzi',

  'audit.title': 'Kumbukumbu za ukaguzi', 'audit.subtitle': 'Kila mabadiliko muhimu — nani aliyafanya na lini', 'audit.actor': 'Mtumiaji', 'audit.event': 'Tukio',
  'audit.empty': 'Bado hakuna matukio.', 'audit.filterUser': 'Watumiaji wote',
  'a.sale.create': 'Alirekodi mauzo {ref} · {amount}', 'a.sale.payment': 'Alipokea {amount} kwa {ref}',
  'a.sale.void': 'Alibatilisha mauzo {ref} ({amount}) — {reason}', 'a.purchase.create': 'Alipokea mzigo {ref} · {amount}',
  'a.purchase.paid': 'Alimlipa msambazaji kwa {ref} · {amount}', 'a.purchase.void': 'Alibatilisha manunuzi {ref} ({amount}) — {reason}',
  'a.expense.create': 'Alirekodi matumizi: {ref} · {amount}', 'a.expense.void': 'Alibatilisha matumizi: {ref} ({amount}) — {reason}',
  'a.product.create': 'Aliongeza bidhaa {ref}', 'a.product.update': 'Alisasisha bidhaa {ref}', 'a.stock.adjust': 'Alirekebisha {ref} kwa {qty} — {reason}',
  'a.customer.create': 'Aliongeza mteja {ref}', 'a.customer.update': 'Alisasisha mteja {ref}',
  'a.supplier.create': 'Aliongeza msambazaji {ref}', 'a.supplier.update': 'Alisasisha msambazaji {ref}',
  'a.member.add': 'Alimwongeza {ref} kama {role}', 'a.member.role': 'Alimbadilisha {ref} kuwa {role}', 'a.member.remove': 'Alimwondoa {ref} kwenye timu',
  'a.org.create': 'Alianzisha biashara {ref}', 'a.org.update': 'Alisasisha mipangilio ya biashara', 'a.category.create': 'Aliongeza kundi {ref}',

  'set.title': 'Mipangilio', 'set.subtitle': 'Wasifu wa biashara na mapendeleo', 'set.profile': 'Wasifu wa biashara', 'set.name': 'Jina la biashara',
  'set.type': 'Aina ya biashara', 'set.region': 'Mkoa', 'set.address': 'Anwani', 'set.tin': 'Namba ya TIN', 'set.features': 'Vipengele',
  'set.inventory': 'Fuatilia stoo', 'set.inventoryHint': 'Zima kama unauza huduma au huhifadhi stoo. Mauzo hayatakagua wala kubadilisha stoo.',
  'set.saved': 'Mipangilio imehifadhiwa', 'set.demo': 'Data ya mfano', 'set.reset': 'Rudisha data ya mfano',
  'set.demoHint': 'Kila kitu kinahifadhiwa kwenye kivinjari hiki tu. Kurudisha kunaleta biashara mbili za mfano na kukutoa nje.',
  'set.resetConfirm': 'Futa mabadiliko yote yaliyofanywa kwenye kivinjari hiki na urudishe data ya mfano?', 'set.readOnly': 'Mmiliki pekee ndiye anayeweza kubadilisha mipangilio hii.',
};

const DICT: Record<Lang, Record<I18nKey, string>> = { en: EN, sw: SW };

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(read('tbms_lang') === 'sw' ? 'sw' : 'en');

  constructor() { document.documentElement.lang = this.lang(); }

  /** Translate a key; `{name}` placeholders are filled from params. Unknown keys fall back to the key itself. */
  t(key: I18nKey | string, params?: Record<string, string | number>): string {
    const dict = DICT[this.lang()] as Record<string, string>;
    let s = dict[key] ?? (EN as Record<string, string>)[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
    return s;
  }

  has(key: string) { return key in EN; }

  toggle() {
    const next: Lang = this.lang() === 'en' ? 'sw' : 'en';
    this.lang.set(next);
    write('tbms_lang', next);
    document.documentElement.lang = next;
  }

  locale(): string { return this.lang() === 'sw' ? 'sw-TZ' : 'en-TZ'; }
}

export { read as readStorage, write as writeStorage };
