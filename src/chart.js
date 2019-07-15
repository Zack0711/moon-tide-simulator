const infoModal = document.getElementById('info-modal');
const modalTitle = infoModal.getElementsByClassName('modal-title')[0];
const modalContent = infoModal.getElementsByClassName('modal-body')[0];
const closeBtn = infoModal.getElementsByClassName('close')[0]

const hideModal = () => {
  document.body.classList.remove('modal-open');
  infoModal.classList.remove('fade', 'show');
  infoModal.style.display = '';
}

const showModal = () => {
  document.body.classList.add('modal-open');
  infoModal.classList.add('fade', 'show');
  infoModal.style.display = 'block';
}

const updateModal = (data, pos) => {

  const eclipseTime = new Date(pos.eclipseDate.c2);
  const currentMonth = eclipseTime.getMonth();
  const currentDate = eclipseTime.getDate();

  const year = new Date(data.year).getFullYear();

  const fragment = document.createDocumentFragment();
  const colC1 = document.createElement('div');
  const colC2 = document.createElement('div');

  const pPress = document.createElement('div');
  const pTemperature = document.createElement('div');
  const pDewPoint = document.createElement('div');
  const pWind = document.createElement('div');

  const pPrecp = document.createElement('div');

  pPress.innerHTML = `
    <h6>氣壓</h6>
    <ul>
      <li><strong>測站氣壓(hPa)：</strong>${data['StnPres']}</li>
      <li><strong>海平面氣壓(hPa)：</strong>${data['SeaPres']}</li>
      <li><strong>測站最高氣壓(hPa)：</strong>${data['StnPresMax']}</li>
      <li><strong>測站最高氣壓時間(LST)：</strong>${data['StnPresMaxTime']}</li>
      <li><strong>測站最低氣壓(hPa)：</strong>${data['StnPresMin']}</li>
      <li><strong>測站最低氣壓時間(LST)：</strong>${data['StnPresMinTime']}</li>
    </ul>
  `

  pTemperature.innerHTML = `
    <h6>溫度</h6>
    <ul>
      <li><strong>氣溫(℃)：</strong>${data['Temperature']}</li>
      <li><strong>最高氣溫(℃)：</strong>${data['T Max']}</li>
      <li><strong>最高氣溫時間(LST)：</strong>${data['T Max Time']}</li>
      <li><strong>最低氣溫(℃)：</strong>${data['T Min']}</li>
      <li><strong>最低氣溫時間(LST)：</strong>${data['T Min Time']}</li>
      <li><strong>露點溫度(℃)：</strong>${data['Td dew point']}</li>
    </ul>
  `

  pWind.innerHTML = `
    <h6>風速</h6>
    <ul>
      <li><strong>風速(m/s)：</strong>${data['WS']}</li>
      <li><strong>風向(360degree)：</strong>${data['WD']}</li>
      <li><strong>最大陣風(m/s)：</strong>${data['WSGust']}</li>
      <li><strong>最大陣風風向(360degree)：</strong>${data['WDGust']}</li>
      <li><strong>最大陣風風速時間(LST)：</strong>${data['WGustTime']}</li>
    </ul>
  `;

  pPrecp.innerHTML = `
    <h6>降雨量</h6>
    <ul>
      <li><strong>降水量(mm)：</strong>${data['Precp']}</li>
      <li><strong>降水時數(hr)：</strong>${data['PrecpHour']}</li>
      <li><strong>10分鐘最大降水量(mm)：</strong>${data['PrecpMax10']}</li>
      <li><strong>10分鐘最大降水起始時間(LST)：</strong>${data['PrecpMax10Time']}</li>
      <li><strong>一小時最大降水量(mm)：</strong>${data['PrecpHrMax']}</li>
      <li><strong>一小時最大降水量起始時間(LST)：</strong>${data['PrecpHrMaxTime']}</li>
    </ul>
    <h6>相對濕度 / 蒸發量</h6>
    <ul>
      <li><strong>相對濕度(%)：</strong>${data['RH']}</li>
      <li><strong>A型蒸發量(mm)：</strong>${data['EvapA']}</li>
    </ul>
    <h6>日照 / 雲量</h6>
    <ul>
      <li><strong>日照時數(hr)：</strong>${data['SunShine']}</li>
      <li><strong>全天空日射量(MJ/㎡)：</strong>${data['GloblRad']}</li>
      <li><strong>總雲量(0~10)：</strong>${data['Cloud Amount']}</li>
    </ul>
    <h6>紫外線</h6>
    <ul>
      <li><strong>日最高紫外線指數：</strong>${data['UVI Max']}</li>
      <li><strong>日最高紫外線指數時間(LST)：</strong>${data['UVI Max Time']}</li>
    </ul>
  `;

  colC1.classList.add('col-6');
  colC2.classList.add('col-6');

  colC1.append(pPress);
  colC1.append(pTemperature);
  //colC1.append(pDewPoint);
  colC1.append(pWind);

  colC2.append(pPrecp);

  fragment.append(colC1);
  fragment.append(colC2);

  modalTitle.innerHTML = `${year}年${currentMonth+1}月${currentDate}日${pos.title}天氣總覽觀測資料`
  modalContent.innerHTML = '';
  modalContent.append(fragment);
}

closeBtn.onclick = hideModal;

const drawChart = (pos, dataList) => {
  const eclipseTime = new Date(pos.eclipseDate.c2);
  const currentHours = eclipseTime.getHours()
  const currentMonth = eclipseTime.getMonth();
  const currentDate = eclipseTime.getDate();

  //const dataList = [];
  const history = document.querySelector('.weather-panel .history');
  const fragment = document.createDocumentFragment();



  const contentTitle = document.createElement('h5');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  contentTitle.innerText = `${currentMonth + 1}月${currentDate}日${currentHours}時氣象逐時歷史資料`
  table.classList.add('table');
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>溫度</th>
      <th>相對濕度(%)</th>
      <th>降雨量(mm)</th>
      <th>總雲量(0~10)</th>
      <th>日照時數(hr)</th>
      <th>詳細</th>
    </tr>
  `
  dataList.monthData.forEach( (d, i) => {
    const hourData = dataList.dayData[i].list[currentHours-1];
    const data = d.list[currentDate-1];
    data['year'] = d.url.split('-')[1];

    if(hourData['Temperature']){      
      const tr = document.createElement('tr');
      const dTd = document.createElement('td');
      const t = hourData['Temperature'];
      const rh = hourData['RH'];
      const p = hourData['Precp'];
      const cloud = hourData['Cloud Amount'];
      const sun = hourData['SunShine'];

      const year = new Date(data.year).getFullYear();
      const detailBtn = document.createElement('button');

      detailBtn.classList.add('btn', 'btn-light')
      detailBtn.innerHTML = `<i class="fa fa-file-text-o" aria-hidden="true"></i>`;
      detailBtn.onclick = () => {
        showModal();
        updateModal(data, pos);
      }

      tr.innerHTML = `
        <tr>
          <td>${year}</td>
          <td>${t}</td>
          <td>${rh}</td>
          <td>${p}</td>
          <td>${cloud}</td>
          <td>${sun}</td>
        </tr>
      `

      dTd.append(detailBtn);
      tr.append(dTd);
      tbody.append(tr);
    }
  })

  table.append(thead);
  table.append(tbody);

  fragment.append(contentTitle);
  fragment.append(table);

  history.innerHTML = '';
  history.append(fragment);
}

export {
  drawChart,
}