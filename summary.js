// คีย์สำหรับ localStorage
const STORAGE_KEY = 'budget_app_data';

// ข้อมูลแอปพลิเคชัน
let appData = {
  month: new Date().getMonth().toString(),
  year: new Date().getFullYear().toString(),
  monthlyData: {}
};

// ข้อมูลเดือนปัจจุบันและเดือนก่อนหน้า
let currentMonthData = null;
let previousMonthData = null;

// กราฟ
let expenseChart = null;
let salaryChart = null;

// เริ่มต้นแอปพลิเคชัน
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded in summary page');
  
  // โหลดข้อมูลจาก localStorage
  loadFromLocalStorage();
  
  // สร้าง dropdown เดือนและปี
  createMonthYearDropdowns();
  
  // โหลดข้อมูลของเดือนที่เลือก
  loadCurrentMonthData();
  
  // แสดงข้อมูลบนหน้าเว็บ
  renderSummary();
  
  // เพิ่ม event listeners
  setupEventListeners();
  
  // เพิ่มปุ่มลบข้อมูล
  addDeleteButton();
  
  // เพิ่ม event listeners สำหรับปุ่ม Export และ Import
  setupBackupEventListeners();
});

// โหลดข้อมูลจาก localStorage
function loadFromLocalStorage() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  
  if (savedData) {
    try {
      appData = JSON.parse(savedData);
      console.log('โหลดข้อมูลจาก localStorage สำเร็จ');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
    }
  }
}

// บันทึกข้อมูลลง localStorage
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    console.log('บันทึกข้อมูลลง localStorage สำเร็จ');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
  }
}

// โหลดข้อมูลของเดือนปัจจุบันและเดือนก่อนหน้า
function loadCurrentMonthData() {
  const monthYearKey = `${appData.year}-${appData.month}`;
  
  // โหลดข้อมูลเดือนปัจจุบัน
  currentMonthData = appData.monthlyData[monthYearKey];
  
  if (!currentMonthData) {
    console.warn('ไม่พบข้อมูลของเดือนที่เลือก');
    return;
  }
  
  // หาเดือนก่อนหน้า
  const previousMonth = parseInt(appData.month) - 1;
  const previousYear = parseInt(appData.year);
  const previousMonthKey = previousMonth < 0 
    ? `${previousYear - 1}-11` // ธันวาคมของปีก่อน
    : `${previousYear}-${previousMonth}`;
  
  // โหลดข้อมูลเดือนก่อนหน้า
  previousMonthData = appData.monthlyData[previousMonthKey];
}

// แสดงข้อมูลสรุป
function renderSummary() {
  if (!currentMonthData) {
    alert('ไม่พบข้อมูลของเดือนที่เลือก');
    window.location.href = 'index.html';
    return;
  }
  
  // แสดงเดือนและปี
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const monthName = monthNames[parseInt(appData.month)];
  const thaiYear = parseInt(appData.year) + 543;
  document.getElementById('month-year-display').textContent = `${monthName} ${thaiYear}`;
  
  // แสดงเงินเดือน
  const salary = parseFloat(currentMonthData.salary) || 0;
  document.getElementById('salary-display').textContent = `฿ ${salary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  
  // เปรียบเทียบเงินเดือนกับเดือนก่อน
  if (previousMonthData) {
    const previousSalary = parseFloat(previousMonthData.salary) || 0;
    const difference = parseFloat((salary - previousSalary).toFixed(2));
    
    if (difference > 0) {
      document.getElementById('salary-comparison').textContent = `+${difference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      document.getElementById('salary-comparison').className = 'badge increase-badge';
    } else if (difference < 0) {
      document.getElementById('salary-comparison').textContent = `${difference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      document.getElementById('salary-comparison').className = 'badge decrease-badge';
    } else {
      document.getElementById('salary-comparison').textContent = 'เท่าเดิม';
      document.getElementById('salary-comparison').className = 'badge neutral-badge';
    }
  } else {
    document.getElementById('salary-comparison').textContent = 'เทียบกับเดือนก่อน';
  }
  
  // แสดงข้อมูลหนี้สิน
  renderCategoryDetails('หนี้สิน', 'debt');
  
  // แสดงข้อมูลคืนเงินตัวเอง
  renderCategoryDetails('คืนเงินตัวเอง', 'self-return');
  
  // แสดงข้อมูลการลงทุน
  renderCategoryDetails('การลงทุน', 'investment');
  
  // แสดงเงินคงเหลือ
  const remaining = parseFloat(currentMonthData.remaining) || 0;
  document.getElementById('remaining-amount').textContent = `${remaining.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`;
  
  // เปรียบเทียบเงินคงเหลือกับเดือนก่อน
  if (previousMonthData) {
    const previousRemaining = parseFloat(previousMonthData.remaining) || 0;
    const difference = parseFloat((remaining - previousRemaining).toFixed(2));
    
    if (difference > 0) {
      document.getElementById('remaining-comparison').textContent = `+${difference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      document.getElementById('remaining-comparison').className = 'badge increase-badge';
    } else if (difference < 0) {
      document.getElementById('remaining-comparison').textContent = `${difference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      document.getElementById('remaining-comparison').className = 'badge decrease-badge';
    } else {
      document.getElementById('remaining-comparison').textContent = 'เท่าเดิม';
      document.getElementById('remaining-comparison').className = 'badge neutral-badge';
    }
  }
  
  // แสดงข้อมูลค่าใช้จ่ายในเดือนและเงินออม (คำนวณใหม่)
  renderAllocationsWithCorrectCalculation();
  
  // สร้างกราฟรายจ่าย
  renderExpenseChart();
  
  // สร้างกราฟเงินเดือนย้อนหลัง
  renderSalaryChart();
}

// แสดงรายละเอียดหมวดหมู่ค่าใช้จ่าย
function renderCategoryDetails(category, elementPrefix) {
  const detailsContainer = document.getElementById(`${elementPrefix}-details`);
  detailsContainer.innerHTML = '';
  
  let total = 0;
  
  // กรองรายการตามหมวดหมู่
  const items = currentMonthData.expenses.filter(expense => 
    expense.category === category && expense.name && expense.amount
  );
  
  // แสดงรายการ
  items.forEach(item => {
    const amount = parseFloat(item.amount) || 0;
    total += amount;
    
    const itemElement = document.createElement('div');
    itemElement.className = 'flex-between detail-item';
    itemElement.innerHTML = `
      <span>${item.name}</span>
      <span>${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
    `;
    
    detailsContainer.appendChild(itemElement);
  });
  
  // แสดงยอดรวม
  total = parseFloat(total.toFixed(2));
  document.getElementById(`${elementPrefix}-total`).textContent = `${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`;
  
  // เปรียบเทียบกับเดือนก่อน
  if (previousMonthData) {
    let previousTotal = 0;
    
    previousMonthData.expenses.forEach(expense => {
      if (expense.category === category) {
        previousTotal += parseFloat(expense.amount) || 0;
      }
    });
    
    const difference = parseFloat((total - previousTotal).toFixed(2));
    const comparisonElement = document.getElementById(`${elementPrefix}-comparison`);
    
    if (difference > 0) {
      comparisonElement.textContent = `+${difference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      comparisonElement.className = 'badge decrease-badge'; // เพิ่มขึ้นเป็นสีแดง (ไม่ดี)
    } else if (difference < 0) {
      comparisonElement.textContent = `${difference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      comparisonElement.className = 'badge increase-badge'; // ลดลงเป็นสีเขียว (ดี)
    } else {
      comparisonElement.textContent = 'เท่าเดิม';
      comparisonElement.className = 'badge neutral-badge';
    }
  }
}

// แสดงรายละเอียดการแบ่งเงินด้วยการคำนวณที่ถูกต้อง
function renderAllocationsWithCorrectCalculation() {
  // แยกรายการตามหมวดหมู่
  const expenseItems = currentMonthData.allocations.filter(item => 
    item.category === 'ค่าใช้จ่ายในเดือน' && item.name && item.amount
  );
  
  const savingItems = currentMonthData.allocations.filter(item => 
    item.category === 'เงินออม' && item.name && item.amount
  );
  
  // แยกรายการตามหน่วย (บาท/เปอร์เซ็นต์)
  const expenseFixedItems = expenseItems.filter(item => item.unit === 'fixed');
  const expensePercentItems = expenseItems.filter(item => item.unit === 'percentage');
  
  const savingFixedItems = savingItems.filter(item => item.unit === 'fixed');
  const savingPercentItems = savingItems.filter(item => item.unit === 'percentage');
  
  // คำนวณยอดรวมของรายการที่เป็นบาท
  let expenseTotal = 0;
  let savingTotal = 0;
  
  expenseFixedItems.forEach(item => {
    expenseTotal += parseFloat(item.amount) || 0;
  });
  
  savingFixedItems.forEach(item => {
    savingTotal += parseFloat(item.amount) || 0;
  });
  
  // คำนวณยอดคงเหลือหลังหักรายการที่เป็นบาท
  const remaining = parseFloat(currentMonthData.remaining) || 0;
  const remainingAfterFixed = parseFloat((remaining - expenseTotal - savingTotal).toFixed(2));
  
  // คำนวณยอดรวมเปอร์เซ็นต์
  let totalExpensePercent = 0;
  let totalSavingPercent = 0;
  
  expensePercentItems.forEach(item => {
    totalExpensePercent += parseFloat(item.amount) || 0;
  });
  
  savingPercentItems.forEach(item => {
    totalSavingPercent += parseFloat(item.amount) || 0;
  });
  
  // ตรวจสอบว่ายอดรวมเปอร์เซ็นต์เกิน 100% หรือไม่
  const totalPercent = totalExpensePercent + totalSavingPercent;
  
  if (totalPercent > 100) {
    console.warn('ยอดรวมเปอร์เซ็นต์เกิน 100%');
  }
  
  // แสดงรายการค่าใช้จ่ายในเดือน
  renderAllocationDetailsWithCorrectCalculation('ค่าใช้จ่ายในเดือน', 'expense', expenseFixedItems, expensePercentItems, remainingAfterFixed, totalPercent);
  
  // แสดงรายการเงินออม
  renderAllocationDetailsWithCorrectCalculation('เงินออม', 'saving', savingFixedItems, savingPercentItems, remainingAfterFixed, totalPercent);
  
  // เปรียบเทียบกับเดือนก่อน
  if (previousMonthData) {
    // คำนวณยอดรวมค่าใช้จ่ายในเดือนปัจจุบัน
    let currentExpenseTotal = calculateAllocationTotal('ค่าใช้จ่ายในเดือน', expenseFixedItems, expensePercentItems, remainingAfterFixed, totalPercent);
    
    // คำนวณยอดรวมเงินออมในเดือนปัจจุบัน
    let currentSavingTotal = calculateAllocationTotal('เงินออม', savingFixedItems, savingPercentItems, remainingAfterFixed, totalPercent);
    
    // คำนวณยอดรวมค่าใช้จ่ายในเดือนก่อนหน้า
    let previousExpenseTotal = 0;
    let previousSavingTotal = 0;
    
    if (previousMonthData) {
      // แยกรายการตามหมวดหมู่
      const prevExpenseItems = previousMonthData.allocations.filter(item => 
        item.category === 'ค่าใช้จ่ายในเดือน' && item.name && item.amount
      );
      
      const prevSavingItems = previousMonthData.allocations.filter(item => 
        item.category === 'เงินออม' && item.name && item.amount
      );
      
      // แยกรายการตามหน่วย (บาท/เปอร์เซ็นต์)
      const prevExpenseFixedItems = prevExpenseItems.filter(item => item.unit === 'fixed');
      const prevExpensePercentItems = prevExpenseItems.filter(item => item.unit === 'percentage');
      
      const prevSavingFixedItems = prevSavingItems.filter(item => item.unit === 'fixed');
      const prevSavingPercentItems = prevSavingItems.filter(item => item.unit === 'percentage');
      
      // คำนวณยอดรวมของรายการที่เป็นบาท
      let prevExpenseTotalFixed = 0;
      let prevSavingTotalFixed = 0;
      
      prevExpenseFixedItems.forEach(item => {
        prevExpenseTotalFixed += parseFloat(item.amount) || 0;
      });
      
      prevSavingFixedItems.forEach(item => {
        prevSavingTotalFixed += parseFloat(item.amount) || 0;
      });
      
      // คำนวณยอดคงเหลือหลังหักรายการที่เป็นบาท
      const prevRemaining = parseFloat(previousMonthData.remaining) || 0;
      const prevRemainingAfterFixed = parseFloat((prevRemaining - prevExpenseTotalFixed - prevSavingTotalFixed).toFixed(2));
      
      // คำนวณยอดรวมเปอร์เซ็นต์
      let prevTotalExpensePercent = 0;
      let prevTotalSavingPercent = 0;
      
      prevExpensePercentItems.forEach(item => {
        prevTotalExpensePercent += parseFloat(item.amount) || 0;
      });
      
      prevSavingPercentItems.forEach(item => {
        prevTotalSavingPercent += parseFloat(item.amount) || 0;
      });
      
      // ตรวจสอบว่ายอดรวมเปอร์เซ็นต์เกิน 100% หรือไม่
      const prevTotalPercent = prevTotalExpensePercent + prevTotalSavingPercent;
      
      // คำนวณยอดรวมค่าใช้จ่ายในเดือนก่อนหน้า
      previousExpenseTotal = calculateAllocationTotal('ค่าใช้จ่ายในเดือน', prevExpenseFixedItems, prevExpensePercentItems, prevRemainingAfterFixed, prevTotalPercent);
      
      // คำนวณยอดรวมเงินออมในเดือนก่อนหน้า
      previousSavingTotal = calculateAllocationTotal('เงินออม', prevSavingFixedItems, prevSavingPercentItems, prevRemainingAfterFixed, prevTotalPercent);
    }
    
    // เปรียบเทียบค่าใช้จ่ายในเดือน
    const expenseDifference = parseFloat((currentExpenseTotal - previousExpenseTotal).toFixed(2));
    const expenseComparisonElement = document.querySelector('.category-section:nth-of-type(5) .badge');
    
    if (expenseDifference > 0) {
      expenseComparisonElement.textContent = `+${expenseDifference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      expenseComparisonElement.className = 'badge decrease-badge'; // เพิ่มขึ้นเป็นสีแดง (ไม่ดี)
    } else if (expenseDifference < 0) {
      expenseComparisonElement.textContent = `${expenseDifference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      expenseComparisonElement.className = 'badge increase-badge'; // ลดลงเป็นสีเขียว (ดี)
    } else {
      expenseComparisonElement.textContent = 'เท่าเดิม';
      expenseComparisonElement.className = 'badge neutral-badge';
    }
    
    // เปรียบเทียบเงินออม
    const savingDifference = parseFloat((currentSavingTotal - previousSavingTotal).toFixed(2));
    const savingComparisonElement = document.querySelector('.category-section:nth-of-type(6) .badge');
    
    if (savingDifference > 0) {
      savingComparisonElement.textContent = `+${savingDifference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      savingComparisonElement.className = 'badge increase-badge'; // เพิ่มขึ้นเป็นสีเขียว (ดี)
    } else if (savingDifference < 0) {
      savingComparisonElement.textContent = `${savingDifference.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      savingComparisonElement.className = 'badge decrease-badge'; // ลดลงเป็นสีแดง (ไม่ดี)
    } else {
      savingComparisonElement.textContent = 'เท่าเดิม';
      savingComparisonElement.className = 'badge neutral-badge';
    }
  }
}

// คำนวณยอดรวมของหมวดหมู่
function calculateAllocationTotal(category, fixedItems, percentItems, remainingAfterFixed, totalPercent) {
  let totalAmount = 0;
  
  // คำนวณยอดรวมของรายการที่เป็นบาท
  fixedItems.forEach(item => {
    totalAmount += parseFloat(item.amount) || 0;
  });
  
  // คำนวณยอดรวมของรายการที่เป็นเปอร์เซ็นต์
  let percentTotal = 0;
  
  percentItems.forEach(item => {
    percentTotal += parseFloat(item.amount) || 0;
  });
  
  // คำนวณจำนวนเงินตามสัดส่วนเปอร์เซ็นต์
  if (totalPercent <= 100) {
    totalAmount += parseFloat(((percentTotal / 100) * remainingAfterFixed).toFixed(2));
  } else {
    // ถ้าเปอร์เซ็นต์รวมเกิน 100% ให้ปรับสัดส่วน
    totalAmount += parseFloat(((percentTotal / totalPercent) * remainingAfterFixed).toFixed(2));
  }
  
  return parseFloat(totalAmount.toFixed(2));
}

// แสดงรายละเอียดการแบ่งเงินด้วยการคำนวณที่ถูกต้อง
function renderAllocationDetailsWithCorrectCalculation(category, elementPrefix, fixedItems, percentItems, remainingAfterFixed, totalPercent) {
  const detailsContainer = document.getElementById(`${elementPrefix}-details`);
  detailsContainer.innerHTML = '';
  
  let totalAmount = 0;
  
  // แสดงรายการที่เป็นบาท
  fixedItems.forEach(item => {
    const amount = parseFloat(item.amount) || 0;
    totalAmount += amount;
    
    const itemElement = document.createElement('div');
    itemElement.className = 'flex-between detail-item';
    itemElement.innerHTML = `
      <div class="flex">
        <span class="badge fixed-badge">Fixed</span>
        <span>${item.name}</span>
      </div>
      <div class="text-right">
        <div>${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</div>
      </div>
    `;
    
    detailsContainer.appendChild(itemElement);
  });
  
  // แสดงรายการที่เป็นเปอร์เซ็นต์
  percentItems.forEach(item => {
    const percent = parseFloat(item.amount) || 0;
    
    // คำนวณจำนวนเงินตามสัดส่วนเปอร์เซ็นต์
    let calculatedAmount = 0;
    
    if (totalPercent <= 100) {
      calculatedAmount = (percent / 100) * remainingAfterFixed;
    } else {
      // ถ้าเปอร์เซ็นต์รวมเกิน 100% ให้ปรับสัดส่วน
      calculatedAmount = (percent / totalPercent) * remainingAfterFixed;
    }
    
    // ปรับให้มีทศนิยม 2 ตำแหน่ง
    calculatedAmount = parseFloat(calculatedAmount.toFixed(2));
    
    totalAmount += calculatedAmount;
    
    const itemElement = document.createElement('div');
    itemElement.className = 'flex-between detail-item';
    itemElement.innerHTML = `
      <div class="flex">
        <span class="badge percentage-badge">${percent}%</span>
        <span>${item.name}</span>
      </div>
      <div class="text-right">
        <div>${calculatedAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</div>
      </div>
    `;
    
    detailsContainer.appendChild(itemElement);
  });
  
  // แสดงยอดรวม
  totalAmount = parseFloat(totalAmount.toFixed(2));
  document.getElementById(`${elementPrefix}-total`).textContent = `${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`;
}

// สร้างกราฟรายจ่าย
function renderExpenseChart() {
  const ctx = document.getElementById('expense-chart').getContext('2d');
  
  // คำนวณยอดรวมแต่ละหมวดหมู่
  let debtTotal = 0;
  let returnTotal = 0;
  let investmentTotal = 0;
  let expenseTotal = 0;
  let savingTotal = 0;
  
  // คำนวณค่าใช้จ่าย
  currentMonthData.expenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;
    
    if (expense.category === 'หนี้สิน') {
      debtTotal += amount;
    } else if (expense.category === 'คืนเงินตัวเอง') {
      returnTotal += amount;
    } else if (expense.category === 'การลงทุน') {
      investmentTotal += amount;
    }
  });
  
  // แยกรายการตามหมวดหมู่
  const expenseItems = currentMonthData.allocations.filter(item => 
    item.category === 'ค่าใช้จ่ายในเดือน' && item.name && item.amount
  );
  
  const savingItems = currentMonthData.allocations.filter(item => 
    item.category === 'เงินออม' && item.name && item.amount
  );
  
  // แยกรายการตามหน่วย (บาท/เปอร์เซ็นต์)
  const expenseFixedItems = expenseItems.filter(item => item.unit === 'fixed');
  const expensePercentItems = expenseItems.filter(item => item.unit === 'percentage');
  
  const savingFixedItems = savingItems.filter(item => item.unit === 'fixed');
  const savingPercentItems = savingItems.filter(item => item.unit === 'percentage');
  
  // คำนวณยอดรวมของรายการที่เป็นบาท
  expenseFixedItems.forEach(item => {
    expenseTotal += parseFloat(item.amount) || 0;
  });
  
  savingFixedItems.forEach(item => {
    savingTotal += parseFloat(item.amount) || 0;
  });
  
  // คำนวณยอดคงเหลือหลังหักรายการที่เป็นบาท
  const remaining = parseFloat(currentMonthData.remaining) || 0;
  const remainingAfterFixed = parseFloat((remaining - expenseTotal - savingTotal).toFixed(2));
  
  // คำนวณยอดรวมเปอร์เซ็นต์
  let totalExpensePercent = 0;
  let totalSavingPercent = 0;
  
  expensePercentItems.forEach(item => {
    totalExpensePercent += parseFloat(item.amount) || 0;
  });
  
  savingPercentItems.forEach(item => {
    totalSavingPercent += parseFloat(item.amount) || 0;
  });
  
  // ตรวจสอบว่ายอดรวมเปอร์เซ็นต์เกิน 100% หรือไม่
  const totalPercent = totalExpensePercent + totalSavingPercent;
  
  // คำนวณจำนวนเงินตามสัดส่วนเปอร์เซ็นต์
  if (totalPercent <= 100) {
    expenseTotal += parseFloat(((totalExpensePercent / 100) * remainingAfterFixed).toFixed(2));
    savingTotal += parseFloat(((totalSavingPercent / 100) * remainingAfterFixed).toFixed(2));
  } else {
    // ถ้าเปอร์เซ็นต์รวมเกิน 100% ให้ปรับสัดส่วน
    expenseTotal += parseFloat(((totalExpensePercent / totalPercent) * remainingAfterFixed).toFixed(2));
    savingTotal += parseFloat(((totalSavingPercent / totalPercent) * remainingAfterFixed).toFixed(2));
  }
  
  // ปรับให้มีทศนิยม 2 ตำแหน่ง
  debtTotal = parseFloat(debtTotal.toFixed(2));
  returnTotal = parseFloat(returnTotal.toFixed(2));
  investmentTotal = parseFloat(investmentTotal.toFixed(2));
  expenseTotal = parseFloat(expenseTotal.toFixed(2));
  savingTotal = parseFloat(savingTotal.toFixed(2));
  
  // ถ้ามีกราฟอยู่แล้ว ให้ทำลายก่อน
  if (expenseChart) {
    expenseChart.destroy();
  }
  
  // สร้างกราฟใหม่
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['หนี้สิน', 'คืนเงินตัวเอง', 'การลงทุน', 'ค่าใช้จ่ายในเดือน', 'เงินออม'],
      datasets: [{
        data: [debtTotal, returnTotal, investmentTotal, expenseTotal, savingTotal],
        backgroundColor: [
          '#c41e3a', // หนี้สิน
          '#5e35b1', // คืนเงินตัวเอง
          '#1e40af', // การลงทุน
          '#f59e0b', // ค่าใช้จ่ายในเดือน
          '#10b981'  // เงินออม
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.getDatasetMeta(0).total;
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// สร้างกราฟเงินเดือนย้อนหลัง
function renderSalaryChart() {
  const ctx = document.getElementById('salary-chart').getContext('2d');
  
  // เตรียมข้อมูลเงินเดือนย้อนหลัง 6 เดือน
  const labels = [];
  const data = [];
  
  // หาเดือนปัจจุบัน
  const currentMonth = parseInt(appData.month);
  const currentYear = parseInt(appData.year);
  
  // ย้อนหลัง 6 เดือน
  for (let i = 5; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;
    
    // ปรับเดือนและปีถ้าเดือนติดลบ
    while (month < 0) {
      month += 12;
      year -= 1;
    }
    
    const monthNames = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    
    const monthYearKey = `${year}-${month}`;
    const monthData = appData.monthlyData[monthYearKey];
    
    labels.push(monthNames[month]);
    
    if (monthData) {
      data.push(parseFloat((parseFloat(monthData.salary) || 0).toFixed(2)));
    } else {
      data.push(0);
    }
  }
  
  // ถ้ามีกราฟอยู่แล้ว ให้ทำลายก่อน
  if (salaryChart) {
    salaryChart.destroy();
  }
  
  // สร้างกราฟใหม่
  salaryChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'เงินเดือน',
        data: data,
        fill: {
          target: 'origin',
          above: 'rgba(16, 185, 129, 0.1)'
        },
        borderColor: '#10b981',
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ฿';
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              return `${label}: ${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`;
            }
          }
        }
      }
    }
  });
}

// สร้าง dropdown เดือนและปี
function createMonthYearDropdowns() {
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  // สร้าง dropdown เดือน
  const monthSelect = document.createElement('select');
  monthSelect.id = 'month-select';
  monthSelect.className = 'select';
  
  monthNames.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = name;
    
    if (index === parseInt(appData.month)) {
      option.selected = true;
    }
    
    monthSelect.appendChild(option);
  });
  
  // สร้าง dropdown ปี
  const yearSelect = document.createElement('select');
  yearSelect.id = 'year-select';
  yearSelect.className = 'select';
  
  // หาปีที่มีข้อมูล
  const years = new Set();
  
  for (const key in appData.monthlyData) {
    if (appData.monthlyData.hasOwnProperty(key)) {
      const year = key.split('-')[0];
      years.add(parseInt(year));
    }
  }
  
  // เพิ่มปีปัจจุบันถ้ายังไม่มี
  years.add(parseInt(appData.year));
  
  // เรียงลำดับปี
  const sortedYears = Array.from(years).sort((a, b) => b - a);
  
  sortedYears.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year + 543; // แปลงเป็นปี พ.ศ.
    
    if (year === parseInt(appData.year)) {
      option.selected = true;
    }
    
    yearSelect.appendChild(option);
  });
  
  // สร้าง container สำหรับ dropdown
  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'month-year-dropdown flex';
  
  const monthContainer = document.createElement('div');
  monthContainer.className = 'select-container';
  monthContainer.appendChild(monthSelect);
  
  const yearContainer = document.createElement('div');
  yearContainer.className = 'select-container';
  yearContainer.appendChild(yearSelect);
  
  dropdownContainer.appendChild(monthContainer);
  dropdownContainer.appendChild(yearContainer);
  
  // เพิ่ม dropdown ไปที่หน้าเว็บ
  const editButton = document.getElementById('edit-button');
  if (editButton && editButton.parentNode) {
    editButton.parentNode.insertBefore(dropdownContainer, editButton);
  } else {
    // ถ้าไม่พบปุ่มแก้ไข ให้เพิ่มที่ส่วนหัวของหน้า
    const headerDiv = document.querySelector('.summary-header .flex-between');
    if (headerDiv) {
      headerDiv.insertBefore(dropdownContainer, headerDiv.firstChild.nextSibling);
    }
  }
  
  // เพิ่ม event listener
  monthSelect.addEventListener('change', function() {
    appData.month = this.value;
    loadCurrentMonthData();
    renderSummary();
  });
  
  yearSelect.addEventListener('change', function() {
    appData.year = this.value;
    loadCurrentMonthData();
    renderSummary();
  });
}

// ลบข้อมูลเดือนปัจจุบัน
function deleteCurrentMonthData() {
  const monthYearKey = `${appData.year}-${appData.month}`;
  
  // ยืนยันการลบข้อมูล
  if (confirm(`คุณต้องการลบข้อมูลเดือน ${getMonthName(parseInt(appData.month))} ${parseInt(appData.year) + 543} ใช่หรือไม่?`)) {
    // ลบข้อมูลเดือนปัจจุบัน
    delete appData.monthlyData[monthYearKey];
    
    // บันทึกข้อมูล
    saveToLocalStorage();
    
    // แจ้งเตือน
    alert('ลบข้อมูลเรียบร้อยแล้ว');
    
    // กลับไปหน้าหลัก
    window.location.href = 'index.html';
  }
}

// ฟังก์ชันช่วยเหลือสำหรับแปลงเลขเดือนเป็นชื่อเดือน
function getMonthName(monthNumber) {
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  return monthNames[monthNumber];
}

// เพิ่มปุ่มลบข้อมูล
function addDeleteButton() {
  // เพิ่มปุ่มลบข้อมูล
  const deleteButton = document.createElement('button');
  deleteButton.id = 'delete-button';
  deleteButton.className = 'button button-danger';
  deleteButton.textContent = 'ลบข้อมูล';
  
  // เพิ่มปุ่มลบข้อมูลไปที่ footer
  const footerButtons = document.querySelector('.footer-buttons');
  if (footerButtons) {
    footerButtons.appendChild(deleteButton);
  }
  
  // เพิ่ม event listener สำหรับปุ่มลบข้อมูล
  deleteButton.addEventListener('click', function() {
    deleteCurrentMonthData();
  });
}

// เพิ่ม event listeners
function setupEventListeners() {
  // ปุ่มกลับหน้าหลัก
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.addEventListener('click', function() {
      window.location.href = 'index.html';
    });
  }
  
  // ปุ่มแก้ไข
  const editButton = document.getElementById('edit-button');
  if (editButton) {
    editButton.addEventListener('click', function() {
      window.location.href = 'index.html';
    });
  }
}

// เพิ่ม event listeners สำหรับปุ่ม Export และ Import
function setupBackupEventListeners() {
  console.log('Setting up backup event listeners');
  
  // ปุ่ม Export
  const exportButton = document.getElementById('export-button');
  if (exportButton) {
    console.log('Export button found');
    exportButton.addEventListener('click', function() {
      console.log('Export button clicked');
      exportData();
    });
  } else {
    console.error('Export button not found');
  }
  
  // ปุ่ม Import
  const importFile = document.getElementById('import-file');
  if (importFile) {
    console.log('Import file input found');
    importFile.addEventListener('change', function(event) {
      console.log('Import file selected');
      importData(event);
    });
  } else {
    console.error('Import file input not found');
  }
}

// ส่งออกข้อมูล
function exportData() {
  console.log('Exporting data...');
  
  // สร้างข้อมูลสำหรับส่งออก
  const dataToExport = JSON.stringify(appData, null, 2);
  
  // สร้าง Blob
  const blob = new Blob([dataToExport], { type: 'application/json' });
  
  // สร้าง URL สำหรับดาวน์โหลด
  const url = URL.createObjectURL(blob);
  
  // สร้างลิงก์สำหรับดาวน์โหลด
  const a = document.createElement('a');
  a.href = url;
  
  // ตั้งชื่อไฟล์
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  a.download = `budget-app-backup-${formattedDate}.json`;
  
  // เพิ่มลิงก์ไปที่หน้าเว็บและคลิก
  document.body.appendChild(a);
  a.click();
  
  // ลบลิงก์
  document.body.removeChild(a);
  
  // เคลียร์ URL
  URL.revokeObjectURL(url);
  
  // แจ้งเตือน
  alert('ส่งออกข้อมูลเรียบร้อยแล้ว');
}

// นำเข้าข้อมูล
function importData(event) {
  console.log('Importing data...');
  
  const file = event.target.files[0];
  
  if (!file) {
    console.warn('No file selected');
    return;
  }
  
  // ตรวจสอบประเภทไฟล์
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    alert('กรุณาเลือกไฟล์ JSON เท่านั้น');
    event.target.value = '';
    return;
  }
  
  // อ่านไฟล์
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      // แปลงข้อมูลเป็น JSON
      const importedData = JSON.parse(e.target.result);
      
      // ตรวจสอบโครงสร้างข้อมูล
      if (!importedData.monthlyData || !importedData.month || !importedData.year) {
        throw new Error('โครงสร้างข้อมูลไม่ถูกต้อง');
      }
      
      // ยืนยันการนำเข้าข้อมูล
      if (confirm('การนำเข้าข้อมูลจะแทนที่ข้อมูลปัจจุบันทั้งหมด ต้องการดำเนินการต่อหรือไม่?')) {
        // อัปเดตข้อมูล
        appData = importedData;
        
        // บันทึกข้อมูลลง localStorage
        saveToLocalStorage();
        
        // โหลดข้อมูลใหม่
        loadCurrentMonthData();
        
        // สร้าง dropdown เดือนและปีใหม่
        createMonthYearDropdowns();
        
        // แสดงข้อมูลบนหน้าเว็บ
        renderSummary();
        
        // แจ้งเตือน
        alert('นำเข้าข้อมูลเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการนำเข้าข้อมูล:', error);
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + error.message);
    }
    
    // รีเซ็ตค่า input file
    event.target.value = '';
  };
  
  reader.readAsText(file);
}