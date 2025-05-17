// คีย์สำหรับ localStorage
const STORAGE_KEY = 'budget_app_data';

// ข้อมูลแอปพลิเคชัน
let appData = {
  month: new Date().getMonth().toString(),
  year: new Date().getFullYear().toString(),
  monthlyData: {}
};

// เริ่มต้นแอปพลิเคชัน
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');

  // โหลดข้อมูลจาก localStorage
  loadFromLocalStorage();

  // สร้าง dropdown เดือนและปี
  createMonthYearDropdowns();

  // โหลดข้อมูลของเดือนที่เลือก
  loadCurrentMonthData();

  // เพิ่ม event listeners
  setupEventListeners();

  // ตรวจสอบปุ่มบันทึก
  const saveButton = document.getElementById('save-button');
  console.log('Save button:', saveButton);

  if (saveButton) {
    saveButton.addEventListener('click', function() {
      console.log('Save button clicked');
      
      // ตรวจสอบเปอร์เซ็นต์รวมก่อนบันทึก
      if (validatePercentages()) {
        saveToLocalStorage();
        alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      }
    });
  } else {
    console.error('Save button not found');
  }
  
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

// ตรวจสอบเปอร์เซ็นต์รวม
function validatePercentages() {
  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];
  
  if (!currentMonthData) return true;
  
  // แยกรายการตามหมวดหมู่และหน่วย
  const expensePercentItems = currentMonthData.allocations.filter(item => 
    item.category === 'ค่าใช้จ่ายในเดือน' && item.unit === 'percentage'
  );
  
  const savingPercentItems = currentMonthData.allocations.filter(item => 
    item.category === 'เงินออม' && item.unit === 'percentage'
  );
  
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
    // แสดงข้อความแจ้งเตือน
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = `ยอดรวมเปอร์เซ็นต์เกิน 100% (${totalPercent.toFixed(2)}%) กรุณาปรับแก้ไขก่อนบันทึก`;
    
    // ลบข้อความแจ้งเตือนเดิม (ถ้ามี)
    const oldErrorMessage = document.querySelector('.error-message');
    if (oldErrorMessage) {
      oldErrorMessage.remove();
    }
    
    // เพิ่มข้อความแจ้งเตือนไปที่หน้าเว็บ
    const container = document.querySelector('.container');
    container.insertBefore(errorMessage, container.firstChild);
    
    // เลื่อนไปที่ข้อความแจ้งเตือน
    errorMessage.scrollIntoView({ behavior: 'smooth' });
    
    return false;
  }
  
  // ลบข้อความแจ้งเตือนเดิม (ถ้ามี)
  const oldErrorMessage = document.querySelector('.error-message');
  if (oldErrorMessage) {
    oldErrorMessage.remove();
  }
  
  return true;
}

// สร้าง dropdown เดือนและปี
function createMonthYearDropdowns() {
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  // สร้าง dropdown เดือน
  const monthSelect = document.getElementById('month-select');
  if (monthSelect) {
    monthSelect.innerHTML = '';
    
    monthNames.forEach((name, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = name;
      
      if (index === parseInt(appData.month)) {
        option.selected = true;
      }
      
      monthSelect.appendChild(option);
    });
  }

  // สร้าง dropdown ปี
  const yearSelect = document.getElementById('year-select');
  if (yearSelect) {
    yearSelect.innerHTML = '';
    
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
  }
}

// โหลดข้อมูลของเดือนที่เลือก
function loadCurrentMonthData() {
  const monthYearKey = `${appData.year}-${appData.month}`;

  // ถ้ายังไม่มีข้อมูลของเดือนที่เลือก ให้สร้างใหม่
  if (!appData.monthlyData[monthYearKey]) {
    appData.monthlyData[monthYearKey] = {
      salary: '',
      expenses: [],
      allocations: [],
      remaining: 0
    };
  }

  // แสดงข้อมูลบนหน้าเว็บ
  const currentMonthData = appData.monthlyData[monthYearKey];

  // แสดงเงินเดือน
  const salaryInput = document.getElementById('salary-input');
  if (salaryInput) {
    salaryInput.value = currentMonthData.salary;
  }

  // แสดงรายการค่าใช้จ่าย
  renderExpenses('หนี้สิน', 'debt-items');
  renderExpenses('คืนเงินตัวเอง', 'self-return-items');
  renderExpenses('การลงทุน', 'investment-items');

  // แสดงการแบ่งเงิน
  renderAllocations('ค่าใช้จ่ายในเดือน', 'expense-items');
  renderAllocations('เงินออม', 'saving-items');

  // คำนวณเงินคงเหลือ
  calculateRemaining();
  
  // ตรวจสอบเปอร์เซ็นต์รวม
  validatePercentages();
}

// แสดงรายการค่าใช้จ่าย
function renderExpenses(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  container.innerHTML = '';

  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];

  // กรองรายการตามหมวดหมู่
  const items = currentMonthData.expenses.filter(expense => expense.category === category);

  // แสดงรายการ
  items.forEach((item, index) => {
    const itemElement = document.createElement('div');
    itemElement.className = 'expense-item';
    itemElement.innerHTML = `
      <input type="text" class="expense-name" placeholder="รายการ" value="${item.name || ''}" data-index="${index}" data-category="${category}">
      <input type="number" class="expense-amount" placeholder="จำนวนเงิน" value="${item.amount || ''}" data-index="${index}" data-category="${category}">
      <button class="delete-button" data-index="${index}" data-category="${category}">×</button>
    `;
    
    container.appendChild(itemElement);
    
    // เพิ่ม event listeners
    const nameInput = itemElement.querySelector('.expense-name');
    const amountInput = itemElement.querySelector('.expense-amount');
    const deleteButton = itemElement.querySelector('.delete-button');
    
    nameInput.addEventListener('input', function() {
      updateExpense(this.dataset.category, parseInt(this.dataset.index), 'name', this.value);
    });
    
    amountInput.addEventListener('input', function() {
      updateExpense(this.dataset.category, parseInt(this.dataset.index), 'amount', this.value);
    });
    
    deleteButton.addEventListener('click', function() {
      deleteExpense(this.dataset.category, parseInt(this.dataset.index));
    });
  });
}

// แสดงรายการแบ่งเงิน
function renderAllocations(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  container.innerHTML = '';

  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];

  // กรองรายการตามหมวดหมู่
  const items = currentMonthData.allocations.filter(allocation => allocation.category === category);

  // แสดงรายการ
  items.forEach((item, index) => {
    const itemElement = document.createElement('div');
    itemElement.className = 'allocation-item';
    itemElement.innerHTML = `
      <input type="text" class="allocation-name" placeholder="รายการ" value="${item.name || ''}" data-index="${index}" data-category="${category}">
      <input type="number" class="allocation-amount" placeholder="จำนวน" value="${item.amount || ''}" data-index="${index}" data-category="${category}">
      <select class="unit-select" data-index="${index}" data-category="${category}">
        <option value="fixed" ${item.unit === 'fixed' ? 'selected' : ''}>บาท</option>
        <option value="percentage" ${item.unit === 'percentage' ? 'selected' : ''}>%</option>
      </select>
      <button class="delete-button" data-index="${index}" data-category="${category}">×</button>
    `;
    
    container.appendChild(itemElement);
    
    // เพิ่ม event listeners
    const nameInput = itemElement.querySelector('.allocation-name');
    const amountInput = itemElement.querySelector('.allocation-amount');
    const unitSelect = itemElement.querySelector('.unit-select');
    const deleteButton = itemElement.querySelector('.delete-button');
    
    nameInput.addEventListener('input', function() {
      updateAllocation(this.dataset.category, parseInt(this.dataset.index), 'name', this.value);
    });
    
    amountInput.addEventListener('input', function() {
      updateAllocation(this.dataset.category, parseInt(this.dataset.index), 'amount', this.value);
      validatePercentages(); // ตรวจสอบเปอร์เซ็นต์รวมทุกครั้งที่มีการเปลี่ยนแปลง
    });
    
    unitSelect.addEventListener('change', function() {
      updateAllocation(this.dataset.category, parseInt(this.dataset.index), 'unit', this.value);
      validatePercentages(); // ตรวจสอบเปอร์เซ็นต์รวมทุกครั้งที่มีการเปลี่ยนแปลง
    });
    
    deleteButton.addEventListener('click', function() {
      deleteAllocation(this.dataset.category, parseInt(this.dataset.index));
    });
  });
}

// เพิ่มรายการค่าใช้จ่าย
function addExpense(category, containerId) {
  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];

  // เพิ่มรายการใหม่
  currentMonthData.expenses.push({
    category: category,
    name: '',
    amount: ''
  });

  // บันทึกข้อมูล
  saveToLocalStorage();

  // แสดงรายการใหม่
  renderExpenses(category, containerId);
}

// เพิ่มรายการแบ่งเงิน
function addAllocation(category, containerId) {
  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];

  // เพิ่มรายการใหม่
  currentMonthData.allocations.push({
    category: category,
    name: '',
    amount: '',
    unit: 'fixed' // ค่าเริ่มต้นเป็นบาท
  });

  // บันทึกข้อมูล
  saveToLocalStorage();

  // แสดงรายการใหม่
  renderAllocations(category, containerId);
}

// อัปเดตรายการค่าใช้จ่าย
function updateExpense(category, index, field, value) {
  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];

  // กรองรายการตามหมวดหมู่
  const categoryExpenses = currentMonthData.expenses.filter(expense => expense.category === category);

  if (index >= 0 && index < categoryExpenses.length) {
    // หาตำแหน่งในอาร์เรย์หลัก
    const mainIndex = currentMonthData.expenses.indexOf(categoryExpenses[index]);
    
    if (mainIndex !== -1) {
      // อัปเดตรายการ
      currentMonthData.expenses[mainIndex][field] = value;
      
      // บันทึกข้อมูล
      saveToLocalStorage();
      
      // คำนวณเงินคงเหลือ
      calculateRemaining();
    }
  }
}

// อัปเดตรายการแบ่งเงิน
function updateAllocation(category, index, field, value) {
  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];

  // กรองรายการตามหมวดหมู่
  const categoryAllocations = currentMonthData.allocations.filter(allocation => allocation.category === category);

  if (index >= 0 && index < categoryAllocations.length) {
    // หาตำแหน่งในอาร์เรย์หลัก
    const mainIndex = currentMonthData.allocations.indexOf(categoryAllocations[index]);
    
    if (mainIndex !== -1) {
      // อัปเดตรายการ
      currentMonthData.allocations[mainIndex][field] = value;
      
      // บันทึกข้อมูล
      saveToLocalStorage();
      
      // คำนวณเงินคงเหลือ
      calculateRemaining();
    }
  }
}

// ลบรายการค่าใช้จ่าย
function deleteExpense(category, index) {
  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];

  // กรองรายการตามหมวดหมู่
  const categoryExpenses = currentMonthData.expenses.filter(expense => expense.category === category);

  if (index >= 0 && index < categoryExpenses.length) {
    // หาตำแหน่งในอาร์เรย์หลัก
    const mainIndex = currentMonthData.expenses.indexOf(categoryExpenses[index]);
    
    if (mainIndex !== -1) {
      // ลบรายการ
      currentMonthData.expenses.splice(mainIndex, 1);
      
      // บันทึกข้อมูล
      saveToLocalStorage();
      
      // แสดงรายการใหม่
      renderExpenses(category, category === 'หนี้สิน' ? 'debt-items' : (category === 'คืนเงินตัวเอง' ? 'self-return-items' : 'investment-items'));
      
      // คำนวณเงินคงเหลือ
      calculateRemaining();
    }
  }
}

// ลบรายการแบ่งเงิน
function deleteAllocation(category, index) {
  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];

  // กรองรายการตามหมวดหมู่
  const categoryAllocations = currentMonthData.allocations.filter(allocation => allocation.category === category);

  if (index >= 0 && index < categoryAllocations.length) {
    // หาตำแหน่งในอาร์เรย์หลัก
    const mainIndex = currentMonthData.allocations.indexOf(categoryAllocations[index]);
    
    if (mainIndex !== -1) {
      // ลบรายการ
      currentMonthData.allocations.splice(mainIndex, 1);
      
      // บันทึกข้อมูล
      saveToLocalStorage();
      
      // แสดงรายการใหม่
      renderAllocations(category, category === 'ค่าใช้จ่ายในเดือน' ? 'expense-items' : 'saving-items');
      
      // คำนวณเงินคงเหลือ
      calculateRemaining();
      
      // ตรวจสอบเปอร์เซ็นต์รวม
      validatePercentages();
    }
  }
}

// คำนวณเงินคงเหลือ
function calculateRemaining() {
  const monthYearKey = `${appData.year}-${appData.month}`;
  const currentMonthData = appData.monthlyData[monthYearKey];

  // คำนวณรายจ่ายทั้งหมด
  let totalExpenses = 0;

  currentMonthData.expenses.forEach(expense => {
    totalExpenses += parseFloat(expense.amount) || 0;
  });

  // คำนวณเงินคงเหลือ
  const salary = parseFloat(currentMonthData.salary) || 0;
  const remaining = parseFloat((salary - totalExpenses).toFixed(2));

  // บันทึกเงินคงเหลือ
  currentMonthData.remaining = remaining;

  // แสดงเงินคงเหลือ
  const remainingElement = document.getElementById('remaining-amount');
  if (remainingElement) {
    remainingElement.textContent = `${remaining.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`;
  }

  // บันทึกข้อมูล
  saveToLocalStorage();
}

// เพิ่ม event listeners
function setupEventListeners() {
  console.log('Setting up event listeners');

  // เลือกเดือนและปี
  const monthSelect = document.getElementById('month-select');
  if (monthSelect) {
    monthSelect.addEventListener('change', function() {
      appData.month = this.value;
      loadCurrentMonthData();
    });
  }

  const yearSelect = document.getElementById('year-select');
  if (yearSelect) {
    yearSelect.addEventListener('change', function() {
      appData.year = this.value;
      loadCurrentMonthData();
    });
  }

  // อัปเดตเงินเดือน
  const salaryInput = document.getElementById('salary-input');
  if (salaryInput) {
    salaryInput.addEventListener('input', function() {
      const monthYearKey = `${appData.year}-${appData.month}`;
      appData.monthlyData[monthYearKey].salary = this.value;
      
      // บันทึกข้อมูล
      saveToLocalStorage();
      
      // คำนวณเงินคงเหลือ
      calculateRemaining();
    });
  }

  // เพิ่มรายการค่าใช้จ่าย
  const addDebtButton = document.getElementById('add-debt');
  if (addDebtButton) {
    addDebtButton.addEventListener('click', function() {
      addExpense('หนี้สิน', 'debt-items');
    });
  }

  const addSelfReturnButton = document.getElementById('add-self-return');
  if (addSelfReturnButton) {
    addSelfReturnButton.addEventListener('click', function() {
      addExpense('คืนเงินตัวเอง', 'self-return-items');
    });
  }

  const addInvestmentButton = document.getElementById('add-investment');
  if (addInvestmentButton) {
    addInvestmentButton.addEventListener('click', function() {
      addExpense('การลงทุน', 'investment-items');
    });
  }

  // เพิ่มรายการแบ่งเงิน
  const addExpenseButton = document.getElementById('add-expense');
  if (addExpenseButton) {
    addExpenseButton.addEventListener('click', function() {
      addAllocation('ค่าใช้จ่ายในเดือน', 'expense-items');
    });
  }

  const addSavingButton = document.getElementById('add-saving');
  if (addSavingButton) {
    addSavingButton.addEventListener('click', function() {
      addAllocation('เงินออม', 'saving-items');
    });
  }

  // ดูสรุป
  const viewSummaryButton = document.getElementById('view-summary');
  if (viewSummaryButton) {
    viewSummaryButton.addEventListener('click', function() {
      window.location.href = 'summary.html';
    });
  }

  // ปุ่มบันทึก
  const saveButton = document.getElementById('save-button');
  if (saveButton) {
    console.log('Adding event listener to save button');
    saveButton.addEventListener('click', function() {
      console.log('Save button clicked');
      
      // ตรวจสอบเปอร์เซ็นต์รวมก่อนบันทึก
      if (validatePercentages()) {
        saveToLocalStorage();
        alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      }
    });
  } else {
    console.error('Save button not found');
  }
}

// เพิ่ม event listeners สำหรับปุ่ม Export และ Import
function setupBackupEventListeners() {
  // ปุ่ม Export
  const exportButton = document.getElementById('export-button');
  if (exportButton) {
    exportButton.addEventListener('click', function() {
      exportData();
    });
  }
  
  // ปุ่ม Import
  const importFile = document.getElementById('import-file');
  if (importFile) {
    importFile.addEventListener('change', function(event) {
      importData(event);
    });
  }
}

// ส่งออกข้อมูล
function exportData() {
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
  const file = event.target.files[0];
  
  if (!file) {
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