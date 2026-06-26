// assets/charts.js — 红人计划仪表盘 v4
(function() {
  'use strict';

  var s = getComputedStyle(document.documentElement);
  var teal = s.getPropertyValue('--teal').trim();
  var tealL = s.getPropertyValue('--teal-light').trim();
  var blue = s.getPropertyValue('--blue').trim();
  var ink = s.getPropertyValue('--ink').trim();
  var muted = s.getPropertyValue('--muted').trim();
  var rule = s.getPropertyValue('--rule').trim();
  var bg2 = s.getPropertyValue('--bg2').trim();
  var success = s.getPropertyValue('--success').trim();
  var warning = s.getPropertyValue('--warning').trim();
  var danger = s.getPropertyValue('--danger').trim();

  // ===================== DATA (可被实时数据覆盖) =====================
  var regions = ['华南战区','华东战区','华北战区','西南战区','西北战区','中原战区','中南战区','东北战区'];
  var total   = [31, 62, 2, 2, 0, 0, 301, 47];
  var connect = [19, 47, 0, 2, 0, 0, 251, 17];
  var activat = [4, 4, 0, 2, 0, 0, 33, 1];
  var quality = [1, 1, 0, 1, 0, 0, 1, 1];
  var referral= [0, 0, 0, 0, 0, 0, 0, 0];
  var targets = [260,240,180,130,60,300,180,160];

  // 图表实例缓存（用于更新数据）
  var charts = {};

  // ===================== 计算衍生数据 =====================
  function computeRates() {
    connRate = total.map(function(t,i){ return t>0 ? +(connect[i]/t*100).toFixed(1) : 0; });
    actRate  = total.map(function(t,i){ return t>0 ? +(activat[i]/t*100).toFixed(1) : 0; });
    qualRate = total.map(function(t,i){ return t>0 ? +(quality[i]/t*100).toFixed(1) : 0; });
    sumTotal   = total.reduce(function(a,b){return a+b;}, 0);
    sumConnect = connect.reduce(function(a,b){return a+b;}, 0);
    sumActivat = activat.reduce(function(a,b){return a+b;}, 0);
    sumQuality = quality.reduce(function(a,b){return a+b;}, 0);
  }

  var connRate, actRate, qualRate;
  var sumTotal, sumConnect, sumActivat, sumQuality;
  computeRates();

  // ===================== KPI STRIP =====================
  function buildKPI() {
    var kpis = [
      {label:'红人库总人数', val:sumTotal, clr:teal, sub:'8大战区·红标口径'},
      {label:'总建联人数',   val:sumConnect, clr:success, sub:'中台复核确认添加企微'},
      {label:'总激活人数',   val:sumActivat, clr:warning, sub:'参与企微活动发帖'},
      {label:'优质红人',     val:sumQuality, clr:blue, sub:'"是否优质"字段认证'}
    ];
    var el = document.getElementById('kpiStrip');
    el.innerHTML = kpis.map(function(k){
      var accentClr = k.clr;
      return '<div class="kpi-item"><div class="kpi-accent" style="background:'+accentClr+'"></div>' +
        '<div class="kpi-label">'+k.label+'</div><div class="kpi-num" style="color:'+accentClr+'">'+k.val+'</div>' +
        '<div class="kpi-sub">'+k.sub+'</div></div>';
    }).join('');
  }

  // ===================== OVERALL RATES =====================
  function buildOverallRates() {
    var overallConnRate = sumTotal > 0 ? +(sumConnect / sumTotal * 100).toFixed(1) : 0;
    var overallActRate  = sumTotal > 0 ? +(sumActivat / sumTotal * 100).toFixed(1) : 0;
    var overallQualRate = sumTotal > 0 ? +(sumQuality / sumTotal * 100).toFixed(1) : 0;
    var items = [
      { label: '红人库总计',  value: sumTotal + ' 人' },
      { label: '整体建联率',  value: overallConnRate + '%',  sub: '建联 ' + sumConnect + ' 人' },
      { label: '整体激活率',  value: overallActRate + '%',  sub: '激活 ' + sumActivat + ' 人' },
      { label: '整体优质率',  value: overallQualRate + '%', sub: '优质 ' + sumQuality + ' 人' }
    ];
    var el = document.getElementById('overallRates');
    if (!el) return;
    el.innerHTML = items.map(function(it){
      return '<div class="insight-card"><div class="ic-label">'+it.label+'</div>' +
        '<div class="ic-value">'+it.value+'</div>' +
        (it.sub ? '<div class="ic-sub">'+it.sub+'</div>' : '') + '</div>';
    }).join('');
  }

  // ===================== YANGGUANG SPOTLIGHT (扬光专项) =====================
  // 从 staticRecords 中统计扬光车主数据（模糊匹配：扬光/杨光/阳光）
  var ygStats = { count: 0, connect: 0, activat: 0, quality: 0 };

  function computeYangguang() {
    ygStats = { count: 0, connect: 0, activat: 0, quality: 0 };
    if (!staticRecords || staticRecords.length === 0) return;
    for (var i = 0; i < staticRecords.length; i++) {
      var car = staticRecords[i]['车型'] || '';
      if (car.indexOf('扬光') >= 0 || car.indexOf('杨光') >= 0 || car.indexOf('阳光') >= 0) {
        ygStats.count++;
        if (staticRecords[i]['是否添加企微（中台复核）'] === '是') ygStats.connect++;
        if (staticRecords[i]['是否激活'] === '是') ygStats.activat++;
        if (staticRecords[i]['是否优质'] === '是') ygStats.quality++;
      }
    }
  }

  function buildYangguangBar() {
    var el = document.getElementById('yangguangBar');
    if (!el) return;
    computeYangguang();
    var ygConnRate = ygStats.count > 0 ? +(ygStats.connect / ygStats.count * 100).toFixed(1) : 0;
    var ygActRate  = ygStats.count > 0 ? +(ygStats.activat / ygStats.count * 100).toFixed(1) : 0;
    var ygQualRate = ygStats.count > 0 ? +(ygStats.quality / ygStats.count * 100).toFixed(1) : 0;
    var ygPct = sumTotal > 0 ? (ygStats.count / sumTotal * 100).toFixed(1) : 0;
    var items = [
      { label: '扬光车主',    value: ygStats.count + ' 人',  sub: '占红人库 ' + ygPct + '%', highlight: true },
      { label: '建联率',      value: ygConnRate + '%',       sub: '已建联 ' + ygStats.connect + ' 人' },
      { label: '激活率',      value: ygActRate + '%',        sub: '已激活 ' + ygStats.activat + ' 人' },
      { label: '优质率',      value: ygQualRate + '%',       sub: '优质 ' + ygStats.quality + ' 人' }
    ];
    el.innerHTML = items.map(function(it){
      var hCls = it.highlight ? ' spotlight' : '';
      return '<div class="insight-card'+hCls+'"><div class="ic-label">'+it.label+'</div>' +
        '<div class="ic-value">'+it.value+'</div>' +
        '<div class="ic-sub">'+it.sub+'</div></div>';
    }).join('');
  }

  // ===================== INSIGHTS (中南战区) =====================
  function buildInsights() {
    var zhongnanIdx = 6;
    var zhongnanPct = total[6] > 0 && sumTotal > 0 ? (total[6] / sumTotal * 100).toFixed(1) : 0;
    var zhongnanConnRate = total[6] > 0 ? +(connect[6]/total[6]*100).toFixed(1) : 0;
    var zhongnanActRate = total[6] > 0 ? +(activat[6]/total[6]*100).toFixed(1) : 0;
    var items = [
      {label:'中南战区',  value:total[6] + ' 人',   sub:'占红人库总量 ' + zhongnanPct + '%', highlight:true },
      {label:'建联率',    value:zhongnanConnRate + '%',  sub:'已添加企微 ' + connect[6] + ' 人' },
      {label:'激活率',    value:zhongnanActRate + '%',  sub:'已激活发帖 ' + activat[6] + ' 人' },
      {label:'优质红人',  value:quality[6] + ' 人',      sub:'"是否优质"已认证' }
    ];
    var el = document.getElementById('insightBar');
    el.innerHTML = items.map(function(it){
      var hCls = it.highlight ? ' spotlight' : '';
      return '<div class="insight-card'+hCls+'"><div class="ic-label">'+it.label+'</div>' +
        '<div class="ic-value">'+it.value+'</div>' +
        '<div class="ic-sub">'+it.sub+'</div></div>';
    }).join('');
  }

  // ===================== CHART UTILITY =====================
  var barColors = ['#2B7BD6','#0D9488','#6366F1','#D97706','#94A3B8','#94A3B8','#059669','#7C3AED'];

  // 全局 resize 防抖 — 所有图表共用一个监听器，避免移动端卡顿
  var resizeTimer = null;
  window.addEventListener('resize', function() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      for (var id in charts) {
        if (charts[id]) charts[id].resize();
      }
    }, 150);
  });

  function makeChart(id, option) {
    if (charts[id]) {
      charts[id].dispose();
    }
    var chart = echarts.init(document.getElementById(id), null, { renderer: 'canvas' });
    chart.setOption(option);
    charts[id] = chart;
    return chart;
  }

  function buildChart1() {
    makeChart('chartPool', {
      tooltip: { trigger:'axis', axisPointer:{type:'shadow'}, appendToBody:true,
        formatter:function(p){ return '<strong>'+p[0].name+'</strong><br/>红人库总人数: '+p[0].value+' 人'; }
      },
      grid: { left:55, right:15, top:30, bottom:35 },
      xAxis: { type:'category', data:regions, axisLabel:{color:muted,fontSize:10}, axisLine:{lineStyle:{color:rule}} },
      yAxis: { type:'value', minInterval:1, axisLabel:{color:muted,fontSize:10}, splitLine:{lineStyle:{color:rule,type:'dashed'}} },
      series: [{
        type:'bar', data:total.map(function(v,i){return {value:v,itemStyle:{color:barColors[i]}}; }),
        barMaxWidth:44, label:{show:true,position:'top',color:ink,fontWeight:600,fontSize:11}
      }],
      animation:false
    });
  }

  function buildChart2() {
    makeChart('chartFunnel', {
      tooltip: { trigger:'axis', axisPointer:{type:'shadow'}, appendToBody:true,
        formatter:function(p){
          var s = '<strong>'+p[0].name+'</strong><br/>';
          p.forEach(function(v){ s += v.marker+' '+v.seriesName+': '+v.value+' 人<br/>'; });
          return s;
        }
      },
      legend: { data:['总人数','建联人数','激活人数'], bottom:0, textStyle:{color:muted,fontSize:10} },
      grid: { left:55, right:15, top:30, bottom:45 },
      xAxis: { type:'category', data:regions, axisLabel:{color:muted,fontSize:9}, axisLine:{lineStyle:{color:rule}} },
      yAxis: { type:'value', minInterval:1, axisLabel:{color:muted,fontSize:10}, splitLine:{lineStyle:{color:rule,type:'dashed'}} },
      series: [
        { name:'总人数', type:'bar', data:total,
          itemStyle:{ color:'rgba(13,148,136,0.18)', borderColor:teal, borderWidth:1.5, borderRadius:[4,4,0,0] },
          barWidth:38,
          label:{ show:true, position:'top', color:ink, fontSize:9, fontWeight:600, formatter:function(p){return p.value>0?p.value:'';} } },
        { name:'建联人数', type:'bar', data:connect,
          itemStyle:{ color:'rgba(5,150,105,0.55)', borderRadius:[3,3,0,0] },
          barWidth:26, barGap:'-100%' },
        { name:'激活人数', type:'bar', data:activat,
          itemStyle:{ color:warning, borderRadius:[2,2,0,0] },
          barWidth:14, barGap:'-100%' }
      ],
      animation:false
    });
  }

  function buildChart3() {
    makeChart('chartRates', {
      tooltip: { trigger:'axis', appendToBody:true,
        formatter:function(p){
          var s = '<strong>'+p[0].name+'</strong><br/>';
          p.forEach(function(v){ s += v.marker+' '+v.seriesName+': '+v.value+'%<br/>'; });
          return s;
        }
      },
      legend: { data:['建联率','激活率'], bottom:0, textStyle:{color:muted,fontSize:10} },
      grid: { left:50, right:15, top:30, bottom:45 },
      xAxis: { type:'category', data:regions, axisLabel:{color:muted,fontSize:9}, axisLine:{lineStyle:{color:rule}} },
      yAxis: { type:'value', axisLabel:{formatter:'{value}%',color:muted,fontSize:10}, max:100, splitLine:{lineStyle:{color:rule,type:'dashed'}} },
      series: [
        { name:'建联率', type:'bar', data:connRate, barMaxWidth:28, itemStyle:{color:teal},
          label:{show:true,position:'top',formatter:function(p){return p.value > 0 ? p.value+'%' : '';},fontSize:9,color:ink} },
        { name:'激活率', type:'bar', data:actRate, barMaxWidth:28, itemStyle:{color:warning},
          label:{show:true,position:'top',formatter:function(p){return p.value > 0 ? p.value+'%' : '';},fontSize:9,color:ink} }
      ],
      animation:false
    });
  }

  function buildChart4() {
    makeChart('chartQuality', {
      tooltip: { trigger:'axis', axisPointer:{type:'shadow'}, appendToBody:true,
        formatter:function(p){ return '<strong>'+p[0].name+'</strong><br/>优质红人: '+p[0].value+' 人'; }
      },
      grid: { left:55, right:15, top:30, bottom:35 },
      xAxis: { type:'category', data:regions, axisLabel:{color:muted,fontSize:10}, axisLine:{lineStyle:{color:rule}} },
      yAxis: { type:'value', minInterval:1, axisLabel:{color:muted,fontSize:10}, splitLine:{lineStyle:{color:rule,type:'dashed'}} },
      series: [{
        type:'bar', data:quality.map(function(v){ return {value:v, itemStyle:{color: v>0 ? success : '#e2e8f0'}}; }),
        barMaxWidth:44,
        label:{show:true,position:'top',formatter:function(p){return p.value>0?p.value+'人':'';},fontSize:11,color:ink,fontWeight:600}
      }],
      animation:false
    });
  }

  function buildChart5() {
    makeChart('chartActivation', {
      tooltip: { trigger:'axis', axisPointer:{type:'shadow'}, appendToBody:true,
        formatter:function(p){ return '<strong>'+p[0].name+'</strong><br/>激活人数: '+p[0].value+' 人'; }
      },
      grid: { left:55, right:15, top:30, bottom:35 },
      xAxis: { type:'category', data:regions, axisLabel:{color:muted,fontSize:9,rotate:-20}, axisLine:{lineStyle:{color:rule}} },
      yAxis: { type:'value', minInterval:1, axisLabel:{color:muted,fontSize:10}, splitLine:{lineStyle:{color:rule,type:'dashed'}} },
      series: [{
        type:'bar', data:activat.map(function(v){ var c = v === 0 ? '#e2e8f0' : (v > 20 ? success : warning); return {value:v, itemStyle:{color:c}}; }),
        barMaxWidth:40,
        label:{show:true,position:'top',formatter:function(p){return p.value>0?p.value+'人':'';},fontSize:10,color:ink,fontWeight:600}
      }],
      animation:false
    });
  }

  function buildChart6() {
    makeChart('chartConnectDetail', {
      tooltip: { trigger:'axis', axisPointer:{type:'shadow'}, appendToBody:true },
      grid: { left:55, right:15, top:30, bottom:35 },
      xAxis: { type:'category', data:regions, axisLabel:{color:muted,fontSize:9,rotate:-20}, axisLine:{lineStyle:{color:rule}} },
      yAxis: { type:'value', minInterval:1, axisLabel:{color:muted,fontSize:10}, splitLine:{lineStyle:{color:rule,type:'dashed'}} },
      series: [{
        type:'bar', data:connect.map(function(v){ var c = v === 0 ? '#e2e8f0' : (v > 100 ? success : blue); return {value:v, itemStyle:{color:c}}; }),
        barMaxWidth:40,
        label:{show:true,position:'top',formatter:function(p){return p.value>0?p.value+'人':'';},fontSize:10,color:ink,fontWeight:600}
      }],
      animation:false
    });
  }

  function buildChart7() {
    var achieveRate = total.map(function(t, i) { return targets[i] > 0 ? +(t / targets[i] * 100).toFixed(1) : 0; });
    var maxRate = Math.ceil(Math.max.apply(null, achieveRate) / 10) * 10 + 10;
    makeChart('chartTargets', {
      tooltip: { trigger:'axis', appendToBody:true,
        formatter:function(p){
          var s = '<strong>'+p[0].name+'</strong><br/>';
          p.forEach(function(v){ if(v.seriesName==='达成率'){ s += v.marker+' '+v.seriesName+': '+v.value+'%<br/>'; } else { s += v.marker+' '+v.seriesName+': '+v.value+' 人<br/>'; } });
          return s;
        }
      },
      legend:{ data:['红人库总人数','千人指标','达成率'], bottom:0, textStyle:{color:muted,fontSize:10} },
      grid:{ left:55, right:55, top:30, bottom:45 },
      xAxis:{ type:'category', data:regions, axisLabel:{color:muted,fontSize:9,rotate:-20}, axisLine:{lineStyle:{color:rule}} },
      yAxis:[
        { type:'value', name:'人数', minInterval:1, axisLabel:{color:muted,fontSize:10}, splitLine:{lineStyle:{color:rule,type:'dashed'}} },
        { type:'value', name:'达成率(%)', min:0, max:maxRate, axisLabel:{color:muted,fontSize:10,formatter:'{value}%'}, splitLine:{show:false} }
      ],
      series:[
        { name:'红人库总人数', type:'bar', data:total, barMaxWidth:28, barGap:'30%',
          itemStyle:{ color:'rgba(43,123,214,0.35)', borderColor:'#2B7BD6', borderWidth:1.5, borderRadius:[4,4,0,0] },
          label:{ show:true, position:'top', formatter:function(p){return p.value>0?p.value:'';}, fontSize:9, color:ink, fontWeight:600 } },
        { name:'千人指标', type:'bar', data:targets, barMaxWidth:28,
          itemStyle:{ color:'transparent', borderColor:'#D97706', borderWidth:2, borderType:'dashed', borderRadius:[4,4,0,0] },
          label:{ show:true, position:'top', formatter:function(p){return p.value;}, fontSize:9, color:'#D97706', fontWeight:600 } },
        { name:'达成率', type:'line', yAxisIndex:1, data:achieveRate,
          lineStyle:{ color:'#059669', width:2.5 }, itemStyle:{ color:'#059669' }, symbol:'circle', symbolSize:7,
          label:{ show:true, formatter:function(p){return p.value>0?p.value+'%':'';}, fontSize:9, color:'#059669', fontWeight:600 } }
      ],
      animation:false
    });
  }

  // ===================== DATA TABLE =====================
  function buildTable() {
    var headers = ['战区','红人库总人数','建联人数','激活人数','优质人数','建联率','激活率','优质率','千人指标'];
    var rows = regions.map(function(r,i){
      return [ r, total[i], connect[i], activat[i], quality[i],
        connRate[i]+'%', actRate[i]+'%', qualRate[i]+'%', targets[i] ];
    });
    var thead = '<tr>'+headers.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr>';
    var tbody = rows.map(function(row){
      return '<tr>'+row.map(function(cell,ci){
        var cls = ci===0?'td-region':'td-num';
        if(ci>=5){
          cls='td-pct'; var v=parseFloat(cell);
          cls += v>=80?' pct-high':(v>=30?' pct-mid':' pct-low');
          if(cell==='0.0%') cls='td-pct pct-low';
        }
        return '<td class="'+cls+'">'+cell+'</td>';
      }).join('')+'</tr>';
    }).join('');
    document.getElementById('dataTableWrap').innerHTML = '<table><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table>';
  }

  // ===================== 渲染所有内容 =====================
  function renderAll() {
    computeRates();
    buildKPI();
    buildOverallRates();
    buildYangguangBar();
    buildInsights();
    buildChart1();
    buildChart2();
    buildChart3();
    buildChart4();
    buildChart5();
    buildChart6();
    buildChart7();
    buildTable();
  }

  // 初始渲染（静态数据）
  renderAll();

  // ─── 更新数据时间显示（header + footer）───
  function setUpdateTime(timeStr) {
    var els = document.querySelectorAll('#headerUpdateTime, #genTime');
    for (var i = 0; i < els.length; i++) {
      if (els[i]) els[i].textContent = timeStr;
    }
  }

  // ===================== 自动加载实时数据 =====================
  var isFileProtocol = window.location.protocol === 'file:';
  // 检测是否部署在 GitHub Pages 等静态托管上（无 Python 后端）
  var isStaticHost = window.location.hostname.indexOf('github.io') >= 0 ||
                     window.location.hostname.indexOf('vercel.app') >= 0 ||
                     window.location.hostname.indexOf('netlify.app') >= 0;
  var LARK_PROXY = isFileProtocol ? 'http://localhost:8000/api/lark-query' : window.location.origin + '/api/lark-query';
  var PING_URL = isFileProtocol ? 'http://localhost:8000/api/ping' : window.location.origin + '/api/ping';
  // 静态 JSON 文件基础路径（GitHub Pages 用）
  var STATIC_API;
  (function() {
    var base = window.location.origin;
    var path = window.location.pathname;
    // 去掉文件名（如 index.html），只保留目录部分
    var dir = path.substring(0, path.lastIndexOf('/') + 1);
    STATIC_API = base + dir + 'api/';
  })();
  var liveMode = false;
  var staticRecords = null; // 缓存静态原始记录供前端查询

  // 如果是 file:// 协议，显示警告提示
  if (isFileProtocol) {
    console.warn('[仪表盘] 检测到 file:// 协议，实时数据功能受限。请通过 python serve-dashboard.py 启动后访问 http://localhost:8000');
  }
  if (isStaticHost) {
    console.log('[仪表盘] 静态托管模式，使用预计算 JSON 文件');
  }

  function loadLiveData() {
    if (isStaticHost) {
      return loadStaticData();
    }
    if (isFileProtocol) {
      console.log('[仪表盘] 尝试连接本地服务器...');
    }
    fetch(LARK_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'summary' })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.ok && data.stats) {
        applySummaryData(data);
      } else {
        console.log('[仪表盘] 服务器返回异常:', data.error || '未知错误');
      }
    })
    .catch(function(e){
      console.log('[仪表盘] 本地服务器不可用，尝试静态 JSON...', e.message);
      // 本地服务器不可用时，回退到静态 JSON
      loadStaticData();
    });
  }

  // ─── 静态模式：从 api/ 目录加载预计算 JSON ───
  function loadStaticData() {
    fetch(STATIC_API + 'summary.json')
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data.ok && data.stats) {
          applySummaryData(data);
          liveMode = true;
          var badge = document.getElementById('liveModeBadge');
          if (badge) { badge.style.display = 'inline'; }
        }
      })
      .catch(function(e){
        console.log('[仪表盘] 静态数据加载失败:', e.message);
      });

    // 同时获取数据时间
    fetch(STATIC_API + 'data-info.json')
      .then(function(r){ return r.json(); })
      .then(function(info){
        if (info.ok && info.fetched_at) { setUpdateTime(info.fetched_at); }
      })
      .catch(function(){});

    // 预加载原始记录（供前端查询用 + 扬光专项统计）
    fetch(STATIC_API + 'raw-records.json')
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data.ok) {
          staticRecords = data.records;
          buildYangguangBar(); // 原始记录加载后刷新扬光数据
        }
      })
      .catch(function(){});
  }

  // ─── 应用摘要数据到图表 ───
  function applySummaryData(data) {
    var regionOrder = ['华南战区','华东战区','华北战区','西南战区','西北战区','中原战区','中南战区','东北战区'];
    for (var i = 0; i < regionOrder.length; i++) {
      var st = data.stats[regionOrder[i]];
      if (st) {
        total[i]    = st.total;
        connect[i]  = st.connect;
        activat[i]  = st.activat;
        quality[i]  = st.quality;
        referral[i] = st.referral;
      }
    }
    renderAll();
    liveMode = true;
    var badge = document.getElementById('liveModeBadge');
    if (badge) { badge.style.display = 'inline'; }
    console.log('[仪表盘] 数据已加载: 红标总计' + data.summary.total + '人');

    // 获取数据更新时间
    if (isStaticHost) return; // 静态模式已在 loadStaticData 中获取
    var dataInfoUrl = isFileProtocol ? 'http://localhost:8000/api/data-info' : window.location.origin + '/api/data-info';
    fetch(dataInfoUrl)
      .then(function(r){ return r.json(); })
      .then(function(info){
        if (info.ok && info.fetched_at) { setUpdateTime(info.fetched_at); }
      })
      .catch(function(){});
  }

  // 页面加载后自动尝试加载实时数据
  loadLiveData();

  // ===================== AI CHAT + LIVE LARK QUERY =====================
  var API_KEY = 'sk-f8867e3676a840b88f4e838ccec406d2';
  var API_URL = 'https://api.deepseek.com/v1/chat/completions';

  // 检测服务器是否可用
  (function checkLiveMode() {
    fetch(PING_URL)
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data.ok) { liveMode = true; }
        var badge = document.getElementById('liveModeBadge');
        if (badge) { badge.style.display = liveMode ? 'inline' : 'none'; }
        // 服务器可用时，获取数据更新时间
        if (data.ok) {
          var infoUrl = isFileProtocol ? 'http://localhost:8000/api/data-info' : window.location.origin + '/api/data-info';
          fetch(infoUrl)
            .then(function(r){ return r.json(); })
            .then(function(info){
              if (info.ok && info.fetched_at) { setUpdateTime(info.fetched_at); }
            })
            .catch(function(){});
        }
      })
      .catch(function(){ liveMode = false; });
  })();

  var SYSTEM_PROMPT = '你是一位专业的数据分析秘书，服务于上汽通用五菱"红人计划"项目。你的职责是帮助管理者分析各战区数据，提供专业、客观的数据解读。\n\n' +
    '【行为准则】\n' +
    '1. 始终保持专业、礼貌、得体的语气，像一位称职的企业秘书。\n' +
    '2. 回答必须基于提供的实际数据，不要编造或猜测数据。\n' +
    '3. 如果用户问的问题超出数据范围，礼貌说明数据局限性。\n' +
    '4. 禁止输出任何色情、暴力、违法、政治敏感或不当内容。\n' +
    '5. 禁止提供任何形式的金融建议、医疗建议或法律建议。\n' +
    '6. 保持简洁、精炼、数据驱动的回答风格。\n' +
    '7. 【重要】回复中禁止使用任何Markdown格式符号。不要用 ** 加粗，不要用 * 斜体，不要用 ` 代码，不要用 > 引用，不要用 # 标题。请使用纯文本自然语言输出。\n\n' +
    '【数据定义】\n' +
    '- 红人库总人数：直联库中标记为"属于红标"的记录数\n' +
    '- 建联：中台复核后确认已添加企业微信\n' +
    '- 激活：已参与企业微信活动并发布朋友圈或带话题发帖\n' +
    '- 优质："是否优质"字段标记\n' +
    '- 转介绍：尚未启动，当前数据为0\n\n' +
    '【五菱红标车型知识库】\n' +
    '五菱红标是上汽通用五菱的商用车系列，品牌定位"致敬每一代奋斗者"，累计销量超2100万辆。红标四大产品谱系简称"扬宏荣之光"：\n\n' +
    '1. 五菱扬光：纯电微面，面向城市末端配送物流市场。2025款在售（指导价7.38-12.58万），2026年6月发布升级版扬光Pro。注意：数据中"扬光""杨光""阳光"均为同一车型的不同写法，系统已做模糊匹配。\n' +
    '2. 五菱宏光：经典创富神车，系列包含宏光增程版（6.88-7.98万）、宏光纯电版等多款动力车型。\n' +
    '3. 五菱荣光：传统燃油商用车，荣光EV为荣光家族首款新能源产品（2026年上市），提供荣光与荣光L两款车型，支持"一车三动力"。\n' +
    '4. 五菱之光：传统燃油微面，经典商用车型。\n\n' +
    '【重要：五菱之光与五菱之光EV的区别】\n' +
    '五菱之光EV与五菱之光虽然名称相似，但绝不是同一产品谱系！五菱之光EV是一款截然不同的全新纯电车型，并非之光的纯电版。在数据分析中，"之光"和"之光EV"必须作为两款独立车型分别统计，不可合并。同理，"宏光"与"宏光EV"、"荣光"与"荣光EV"也是不同车型，需分别统计。\n\n' +
    '【五菱红标新能源转型】\n' +
    '五菱红标已全面迈入新能源时代，扬光（纯电）、宏光（增程/纯电）、之光EV（纯电）、荣光EV（2026年上市）共同构成红标新能源产品矩阵。\n\n' +
    '【重要：数据准确性规则】\n' +
    '系统会在您回答前自动执行精确查询，并将查询结果注入上下文。请严格使用【查询结果】中的数字，不要自行从原始记录中数数，因为原始记录中车型等字段存在多种写法（如"扬光"和"五菱扬光"是同款车的不同写法），手动计数容易出错。查询结果中的"匹配数量"是经过模糊匹配的精确统计值。\n\n' +
    '【上下文记忆】\n' +
    '您具备上下文记忆能力，可以记住最近30轮对话的内容。当用户使用"他""她""这个""那个""上面提到的"等指代词时，请结合历史对话理解上下文。当用户追问时（如"那其中有多少人已激活？"），请基于上一轮的查询结果继续分析。\n\n' +
    '请据此提供专业的数据分析服务。';

  var chatMessages = document.getElementById('chatMessages');
  var chatInput = document.getElementById('chatInput');
  var chatBtn = document.getElementById('chatSendBtn');

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'msg ' + role;
    if (role === 'assistant') {
      var tag = document.createElement('div');
      tag.className = 'thinking-tag';
      tag.textContent = liveMode ? '数据分析秘书 · 已接入直联库' : '数据分析秘书 · 基于静态数据';
      div.appendChild(tag);
      var p = document.createElement('span');
      p.innerHTML = text.replace(/\n/g, '<br>');
      div.appendChild(p);
    } else {
      div.textContent = text;
    }
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'msg typing';
    div.id = 'typingIndicator';
    for (var i = 0; i < 3; i++) { var dot = document.createElement('span'); dot.className = 'dot'; div.appendChild(dot); }
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTyping() { var el = document.getElementById('typingIndicator'); if (el) el.remove(); }

  // ─── 获取原始记录（所有红标记录的详细数据）───
  async function fetchRawRecords() {
    // 静态模式：从预加载的记录中生成文本
    if (isStaticHost && staticRecords) {
      return buildRawRecordsText(staticRecords);
    }
    // 静态模式但记录未加载，尝试 fetch
    if (isStaticHost) {
      try {
        var resp = await fetch(STATIC_API + 'raw-records.json');
        var data = await resp.json();
        if (data.ok) {
          staticRecords = data.records;
          return data.text || buildRawRecordsText(data.records);
        }
      } catch (e) {}
      return null;
    }
    // 本地服务器模式
    try {
      var resp2 = await fetch(LARK_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'raw-records' })
      });
      var data2 = await resp2.json();
      if (data2.ok && data2.text) { return data2.text; }
      return null;
    } catch (e) { return null; }
  }

  // ─── 从记录数组构建原始记录文本 ───
  function buildRawRecordsText(records) {
    var key_fields = ["姓名","微信昵称","性别","省份","城市","车型","车主类型","战区","关联经销商","是否属于红标","是否添加企微（中台复核）","是否激活","是否优质","是否流失","主要社媒平台","转介绍数据（中台操作）","创建日期（自动生成）"];
    var lines = [];
    for (var i = 0; i < records.length; i++) {
      var rec = records[i];
      var parts = [];
      for (var j = 0; j < key_fields.length; j++) {
        var v = rec[key_fields[j]];
        if (v && v !== '') { parts.push(key_fields[j] + ':' + v); }
      }
      if (parts.length > 0) { lines.push('[' + (i+1) + '] ' + parts.join(', ')); }
    }
    return '【直联库原始记录（红标' + records.length + '条）】\n' + lines.join('\n');
  }

  // ─── 获取汇总摘要 ───
  async function fetchLiveSummary() {
    // 静态模式
    if (isStaticHost) {
      try {
        var resp = await fetch(STATIC_API + 'summary.json');
        var data = await resp.json();
        if (data.ok && data.text) { return data.text; }
      } catch (e) {}
      return null;
    }
    // 本地服务器模式
    try {
      var resp2 = await fetch(LARK_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summary' })
      });
      var data2 = await resp2.json();
      if (data2.ok && data2.text) { return data2.text; }
      return null;
    } catch (e) { return null; }
  }

  // ─── 精确查询（静态模式在前端执行）───
  async function fetchQuery(field, keyword, exact) {
    // 静态模式：前端过滤
    if (isStaticHost) {
      return frontendQuery(field, keyword, exact);
    }
    // 本地服务器模式
    try {
      var resp = await fetch(LARK_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', field: field, keyword: keyword, exact: exact || false })
      });
      var data = await resp.json();
      if (data.ok && data.text) { return data.text; }
      return null;
    } catch (e) { return null; }
  }

  // ─── 前端查询：从 staticRecords 中筛选 ───
  async function frontendQuery(field, keyword, exact) {
    // 确保记录已加载
    if (!staticRecords) {
      try {
        var resp = await fetch(STATIC_API + 'raw-records.json');
        var data = await resp.json();
        if (data.ok) { staticRecords = data.records; }
      } catch (e) { return null; }
    }
    if (!staticRecords) { return null; }

    var matched = [];
    for (var i = 0; i < staticRecords.length; i++) {
      var val = String(staticRecords[i][field] || '');
      if (exact) {
        if (val === keyword) { matched.push(staticRecords[i]); }
      } else {
        if (val.indexOf(keyword) >= 0) { matched.push(staticRecords[i]); }
      }
    }

    // 统计字段分布
    var fieldDist = {};
    var distFields = ["战区","车型","是否添加企微（中台复核）","是否激活","是否优质","车主类型","主要社媒平台"];
    for (var fi = 0; fi < distFields.length; fi++) {
      var f = distFields[fi];
      var counts = {};
      for (var mi = 0; mi < matched.length; mi++) {
        var v = matched[mi][f];
        if (v && v !== '') { counts[v] = (counts[v] || 0) + 1; }
      }
      var keys = Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; });
      if (keys.length > 0) {
        fieldDist[f] = {};
        for (var ki = 0; ki < Math.min(20, keys.length); ki++) {
          fieldDist[f][keys[ki]] = counts[keys[ki]];
        }
      }
    }

    // 构建明细
    var detailLines = [];
    for (var di = 0; di < Math.min(50, matched.length); di++) {
      var r = matched[di];
      detailLines.push((di+1) + '. ' + (r['姓名']||'未知') + ' | ' + (r['战区']||'未知') + ' | ' + (r['车型']||'未知') + ' | 建联:' + (r['是否添加企微（中台复核）']||'') + ' 激活:' + (r['是否激活']||'') + ' 优质:' + (r['是否优质']||''));
    }
    var detailText = detailLines.join('\n');
    if (matched.length > 50) { detailText += '\n... 共' + matched.length + '条，仅显示前50条'; }

    var matchType = exact ? '精确匹配' : '模糊匹配(包含)';
    var text = '【查询结果】\n筛选条件: ' + field + ' ' + matchType + ' "' + keyword + '"\n匹配数量: ' + matched.length + '人 (红标总数' + staticRecords.length + '人)\n\n字段分布:\n';
    for (var f2 in fieldDist) {
      text += '  ' + f2 + ':\n';
      for (var v2 in fieldDist[f2]) {
        text += '    ' + v2 + ': ' + fieldDist[f2][v2] + '人\n';
      }
    }
    text += '\n匹配明细:\n' + detailText;
    return text;
  }

  // ─── 智能识别用户问题中的查询意图，调用后端精确查询 ───
  async function smartQuery(userText) {
    var queries = [];

    // 车型相关查询 — 支持多车型同时查询
    // 先匹配复合词（之光EV、宏光EV 等），匹配后从文本中移除，避免基础词重复匹配
    var compoundCars = ['之光EV', '宏光EV', '荣光EV', '宏光增程', '扬光Pro', '宏光MINI', '宏光PLUS'];
    var textForSimple = userText;
    for (var i = 0; i < compoundCars.length; i++) {
      if (userText.indexOf(compoundCars[i]) >= 0) {
        queries.push({ field: '车型', keyword: compoundCars[i], exact: false });
        textForSimple = textForSimple.split(compoundCars[i]).join(''); // 移除已匹配的复合词
      }
    }
    // 再匹配基础词（从移除复合词后的文本中查找）
    var simpleCars = ['扬光', '宏光', '之光', '荣光', '征程', '新卡', '小卡'];
    for (var i = 0; i < simpleCars.length; i++) {
      if (textForSimple.indexOf(simpleCars[i]) >= 0) {
        queries.push({ field: '车型', keyword: simpleCars[i], exact: false });
      }
    }

    // 战区相关查询 — 支持多战区同时查询
    var regionKeywords = ['华南', '华东', '华北', '西南', '西北', '中原', '中南', '东北'];
    for (var i = 0; i < regionKeywords.length; i++) {
      if (userText.indexOf(regionKeywords[i]) >= 0) {
        queries.push({ field: '战区', keyword: regionKeywords[i] + '战区', exact: true });
      }
    }

    // 省份相关查询
    var provinceMatch = userText.match(/(广东|广西|湖南|湖北|河南|河北|山东|山西|陕西|四川|云南|贵州|江苏|浙江|安徽|福建|江西|辽宁|吉林|黑龙江|内蒙古|新疆|西藏|青海|甘肃|宁夏|海南|北京|上海|天津|重庆)/);
    if (provinceMatch) {
      queries.push({ field: '省份', keyword: provinceMatch[1], exact: false });
    }

    // 社媒平台查询
    var mediaKeywords = ['抖音', '快手', '小红书', '微信', '微博'];
    for (var i = 0; i < mediaKeywords.length; i++) {
      if (userText.indexOf(mediaKeywords[i]) >= 0) {
        queries.push({ field: '主要社媒平台', keyword: mediaKeywords[i], exact: false });
        break;
      }
    }

    // 执行所有匹配的查询
    var results = [];
    for (var i = 0; i < queries.length; i++) {
      var result = await fetchQuery(queries[i].field, queries[i].keyword, queries[i].exact);
      if (result) { results.push(result); }
    }

    return results.length > 0 ? results.join('\n\n') : null;
  }

  // ─── 对话历史（保留最近30轮对话）───
  var conversationHistory = [];
  var MAX_HISTORY = 30; // 保留最近30轮（60条消息）

  async function sendMessage() {
    var text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    chatBtn.disabled = true;
    addMessage('user', text);
    showTyping();

    // 1. 先执行智能查询（精确统计）
    var queryResult = await smartQuery(text);

    // 2. 获取汇总数据
    var liveContext = '';
    var summaryData = await fetchLiveSummary();

    if (queryResult) {
      liveContext = '\n\n' + queryResult;
      if (summaryData) { liveContext += '\n\n' + summaryData; }
    } else {
      // 没有匹配到特定查询，使用原始记录
      var rawData = await fetchRawRecords();
      if (rawData) {
        liveContext = '\n\n' + rawData;
        if (summaryData) { liveContext += '\n\n' + summaryData; }
      } else if (summaryData) {
        liveContext = '\n\n' + summaryData;
      }
    }

    if (queryResult || summaryData) {
      if (!liveMode) {
        liveMode = true;
        var badge = document.getElementById('liveModeBadge');
        if (badge) { badge.style.display = 'inline'; }
      }
    }

    // 3. 构建消息数组：system + 历史对话 + 当前用户消息
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT + liveContext }
    ];

    // 添加历史对话（最多 MAX_HISTORY 轮）
    var histSlice = conversationHistory.slice(-MAX_HISTORY * 2);
    for (var i = 0; i < histSlice.length; i++) {
      messages.push(histSlice[i]);
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: text });

    try {
      var resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: messages,
          max_tokens: 2048,
          temperature: 0.3
        })
      });

      hideTyping();

      if (!resp.ok) {
        var errMsg = 'API 请求失败 (' + resp.status + ')';
        if (resp.status === 401) errMsg = 'API Key 无效，请联系管理员。';
        else if (resp.status === 429) errMsg = '请求频率过高，请稍后重试。';
        else if (resp.status >= 500) errMsg = 'AI 服务暂时不可用，请稍后重试。';
        addMessage('assistant', errMsg);
        chatBtn.disabled = false;
        return;
      }

      var data = await resp.json();
      var reply = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content : '抱歉，暂时无法获取回复，请稍后再试。';

      reply = reply.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1').replace(/^#+\s*/gm, '');
      addMessage('assistant', reply);

      // 4. 将本轮对话存入历史记忆
      conversationHistory.push({ role: 'user', content: text });
      conversationHistory.push({ role: 'assistant', content: reply });

      // 5. 超过上限时裁剪旧消息
      if (conversationHistory.length > MAX_HISTORY * 2) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY * 2);
      }

    } catch (e) {
      hideTyping();
      addMessage('assistant', '网络连接异常，请检查网络后重试。');
    }

    chatBtn.disabled = false;
  }

  chatBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // ─── 生成日报 ───
  async function generateDailyReport() {
    showTyping();
    try {
      // 按日期存储快照（dailyData_6.24、dailyData_6.25...）
      // 查找基准时自动取最新一个非今天的快照
      // 周五数据保存后，周一打不开周末数据，自然回退到周五 → 周一 vs 上周五 ✅
      try {
        var hasData = false;
        for (var ki = 0; ki < localStorage.length; ki++) {
          var k = localStorage.key(ki);
          if (k && k.indexOf('dailyData_') === 0) { hasData = true; break; }
        }
        if (!hasData) {
          // 迁移旧存储（dailyReportSnapshot）或设初始基准
          var oldStored = localStorage.getItem('dailyReportSnapshot');
          var initialData;
          if (oldStored) {
            try { initialData = JSON.parse(oldStored); } catch(e) {}
          }
          if (!initialData) {
            initialData = {
              date: '6.24',
              total_records: 498, red_count: 443, connect_count: 335,
              activat_count: 44, quality_count: 5,
              yangguang_count: 189, yangguang_connect: 131,
              yangguang_activat: 20, yangguang_quality: 2
            };
          }
          localStorage.setItem('dailyData_' + initialData.date, JSON.stringify(initialData));
        }
      } catch(e) {}
      // 获取当前汇总数据
      var summaryResp = await fetchLiveSummary();
      if (!summaryResp) {
        hideTyping();
        addMessage('assistant', '获取数据失败，请检查网络连接后重试。');
        return;
      }

      // 解析汇总文本中的关键数字（从汇总行取，不是战区行）
      // 文本格式:
      //   总记录数: 502, 红标总计: 446人
      //   整体建联率: 338/446 = 75.8%
      //   整体激活率: 44/446 = 9.9%
      //   整体优质率: 5/446 = 1.1%
      var totalRecords = 0, totalRed = 0, totalConnect = 0, totalActivat = 0, totalQuality = 0;
      var matchTR = summaryResp.match(/总记录数:\s*(\d+)/);
      if (matchTR) totalRecords = parseInt(matchTR[1]);
      var matchR = summaryResp.match(/红标总计:\s*(\d+)/);
      if (matchR) totalRed = parseInt(matchR[1]);
      // 建联: 取 "整体建联率: 338/" 中的 338
      var matchC = summaryResp.match(/整体建联率:\s*(\d+)\//);
      if (matchC) totalConnect = parseInt(matchC[1]);
      // 激活: 取 "整体激活率: 44/" 中的 44
      var matchA = summaryResp.match(/整体激活率:\s*(\d+)\//);
      if (matchA) totalActivat = parseInt(matchA[1]);
      // 优质: 取 "整体优质率: 5/" 中的 5
      var matchQ = summaryResp.match(/整体优质率:\s*(\d+)\//);
      if (matchQ) totalQuality = parseInt(matchQ[1]);

      // 获取扬光车主数据（直接从 staticRecords 过滤，避免正则解析出错）
      var yangguangCount = 0, yangguangConnect = 0, yangguangActivat = 0, yangguangQuality = 0;
      if (staticRecords && staticRecords.length > 0) {
        var ygRecords = [];
        for (var si = 0; si < staticRecords.length; si++) {
          var car = staticRecords[si]['车型'] || '';
          if (car.indexOf('扬光') >= 0) {
            ygRecords.push(staticRecords[si]);
          }
        }
        yangguangCount = ygRecords.length;
        for (var yi = 0; yi < ygRecords.length; yi++) {
          var r = ygRecords[yi];
          if (r['是否添加企微（中台复核）'] === '是') yangguangConnect++;
          if (r['是否激活'] === '是') yangguangActivat++;
          if (r['是否优质'] === '是') yangguangQuality++;
        }
      }

      // 获取对比基准：从 dailyData_* 中找最新一个非今天的快照
      // 例如：今天6.25，有 dailyData_6.24 和 dailyData_6.25 → 取 6.24
      // 周一：有 dailyData_6.26(周五) → 取 6.26 → 周一 vs 上周五 ✅
      var lastSnapshot = null;
      try {
        var todayStr = dateStr;
        var bestDate = '';
        for (var ki = 0; ki < localStorage.length; ki++) {
          var k = localStorage.key(ki);
          if (k && k.indexOf('dailyData_') === 0) {
            var d = k.substring(10); // 'dailyData_'.length
            if (d !== todayStr && d > bestDate) {
              bestDate = d;
              try { lastSnapshot = JSON.parse(localStorage.getItem(k)); } catch(e) {}
            }
          }
        }
      } catch(e) {}

      // 计算差异（diff=0 时不显示任何标注）
      var diffTR = lastSnapshot ? (totalRecords - lastSnapshot.total_records) : 0;
      var diffRed = lastSnapshot ? (totalRed - lastSnapshot.red_count) : 0;
      var diffConn = lastSnapshot ? (totalConnect - lastSnapshot.connect_count) : 0;
      var diffAct = lastSnapshot ? (totalActivat - lastSnapshot.activat_count) : 0;
      var diffQual = lastSnapshot ? (totalQuality - lastSnapshot.quality_count) : 0;
      var diffYG = lastSnapshot ? (yangguangCount - lastSnapshot.yangguang_count) : 0;
      var diffYGConn = lastSnapshot ? (yangguangConnect - lastSnapshot.yangguang_connect) : 0;
      var diffYGAct = lastSnapshot ? (yangguangActivat - lastSnapshot.yangguang_activat) : 0;
      var diffYGQual = lastSnapshot ? (yangguangQuality - lastSnapshot.yangguang_quality) : 0;

      // 获取当前日期
      var now = new Date();
      var month = now.getMonth() + 1;
      var day = now.getDate();
      var dateStr = month + '.' + day;

      // 计算百分比
      var connRate = totalRed > 0 ? (totalConnect / totalRed * 100).toFixed(2) : '0.00';
      var actRate = totalRed > 0 ? (totalActivat / totalRed * 100).toFixed(2) : '0.00';
      var qualRate = totalRed > 0 ? (totalQuality / totalRed * 100).toFixed(2) : '0.00';
      var ygConnRate = yangguangCount > 0 ? (yangguangConnect / yangguangCount * 100).toFixed(2) : '0.00';
      var ygActRate = yangguangCount > 0 ? (yangguangActivat / yangguangCount * 100).toFixed(2) : '0.00';
      var ygQualRate = yangguangCount > 0 ? (yangguangQuality / yangguangCount * 100).toFixed(2) : '0.00';

      // diff 格式：>0 显示新增，<0 显示减少，=0 不显示
      function fmtDiff(val) {
        if (val > 0) return '（新增' + val + '人）';
        if (val < 0) return '（减少' + Math.abs(val) + '人）';
        return ''; // diff=0 什么都不显示
      }

      // 构建报告
      var report = '【"红人计划"数据情况（' + dateStr + '）】\n\n';
      report += '数据清洗后，总表共提取' + totalRecords + '条数据' + fmtDiff(diffTR) + '，其中' + totalRed + '条为红标车型' + fmtDiff(diffRed) + '。';
      report += '总体建联量' + totalConnect + '人' + fmtDiff(diffConn) + '，建联率' + connRate + '%。';
      report += '总体激活量' + totalActivat + '人，激活率' + actRate + '%。';
      report += '优质量（发帖三篇以上）' + totalQuality + '人，优质率' + qualRate + '%。\n\n';
      report += '其中扬光车主有' + yangguangCount + '条数据' + fmtDiff(diffYG) + '，建联' + yangguangConnect + '人' + fmtDiff(diffYGConn) + '，建联率' + ygConnRate + '%，';
      report += '激活量' + yangguangActivat + '人，激活率' + ygActRate + '%，优质量' + yangguangQuality + '人，优质率' + ygQualRate + '%。\n\n';

      // 📌 亮点：分析各战区
      report += '📌 今日亮点\n';
      var regionLines = summaryResp.split('\n');
      var maxRegion = '', maxRegionTotal = 0;
      var inactiveRegions = [];
      for (var k = 0; k < regionLines.length; k++) {
        var line = regionLines[k];
        if (line.indexOf('战区') >= 0 && line.indexOf('总人数') >= 0) {
          var rName = line.match(/(\S+战区)/);
          var rTotal = line.match(/总人数(\d+)/);
          if (rName && rTotal) {
            var n = parseInt(rTotal[1]);
            if (n > maxRegionTotal) { maxRegionTotal = n; maxRegion = rName[1]; }
            // ≤2 人视为未启动（西南战区2人为人工塞入）
            if (n <= 2) { inactiveRegions.push(rName[1]); }
          }
        }
      }
      if (maxRegion) {
        report += '今日增长主要来源' + maxRegion + '。';
      }
      if (inactiveRegions.length > 0) {
        report += inactiveRegions.join('、') + '还未启动。';
      }

      hideTyping();
      addMessage('assistant', report);

      // 保存当天快照（dailyData_日期 格式）
      // 同一天多次点击只覆盖 key，不影响基准查找（查找时跳过当天）
      var snapshot = {
        date: dateStr,
        total_records: totalRecords,
        red_count: totalRed,
        connect_count: totalConnect,
        activat_count: totalActivat,
        quality_count: totalQuality,
        yangguang_count: yangguangCount,
        yangguang_connect: yangguangConnect,
        yangguang_activat: yangguangActivat,
        yangguang_quality: yangguangQuality
      };
      try { localStorage.setItem('dailyData_' + dateStr, JSON.stringify(snapshot)); } catch(e) {}

    } catch(e) {
      hideTyping();
      addMessage('assistant', '生成日报时出现异常，请稍后重试。');
    }
  }

  // ─── 绑定生成日报按钮 ───
  var dailyReportBtn = document.getElementById('dailyReportBtn');
  if (dailyReportBtn) {
    dailyReportBtn.addEventListener('click', function() {
      generateDailyReport();
    });
  }

  // ===================== 导出达成表图片 =====================
  var exportChartBtn = document.getElementById('exportChartBtn');
  if (exportChartBtn) {
    exportChartBtn.addEventListener('click', function() {
      exportAchievementImage();
    });
  }

  function exportAchievementImage() {
    var achieveRate = total.map(function(t, i) { return targets[i] > 0 ? +(t / targets[i] * 100).toFixed(2) : 0; });

    var now = new Date();
    var dateStr = (now.getMonth()+1) + '.' + now.getDate();

    var hiddenDiv = document.createElement('div');
    hiddenDiv.style.cssText = 'position:absolute;left:-9999px;top:0;width:1500px;height:680px;';
    document.body.appendChild(hiddenDiv);

    var chart = echarts.init(hiddenDiv);

    chart.setOption({
      title: {
        text: '各战区指标达成情况（' + dateStr + '）',
        left: 'center', top: 18,
        textStyle: { fontSize: 20, fontWeight: 700, color: '#1E293B', fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif' }
      },
      tooltip: { show: false },
      legend: {
        data: ['千人指标（激活）', '总建联人数', '总激活人数', '总指标达成率'],
        bottom: 12,
        textStyle: { fontSize: 12, color: '#64748B' },
        itemWidth: 14, itemHeight: 14, icon: 'roundRect'
      },
      grid: { left: 72, right: 82, top: 58, bottom: 68 },
      xAxis: {
        type: 'category', data: regions,
        axisLabel: { color: '#475569', fontSize: 11, fontWeight: 600, align: 'center' },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#E2E8F0' } }
      },
      yAxis: [
        {
          type: 'value', name: '人数',
          nameTextStyle: { color: '#94A3B8', fontSize: 11, fontWeight: 500 },
          min: 0, max: 400,
          axisLabel: { color: '#94A3B8', fontSize: 10 },
          splitLine: { lineStyle: { color: '#F1F5F9', width: 1 } },
          axisLine: { show: false }, axisTick: { show: false }
        },
        {
          type: 'value', name: '达成率',
          nameTextStyle: { color: '#94A3B8', fontSize: 11, fontWeight: 500 },
          min: 0, max: 200,
          axisLabel: { color: '#94A3B8', fontSize: 10, formatter: '{value}%' },
          splitLine: { show: false },
          axisLine: { show: false }, axisTick: { show: false }
        }
      ],
      series: [
        {
          name: '千人指标（激活）',
          type: 'bar', data: targets, barWidth: 18,
          itemStyle: { color: '#8896AE', borderRadius: [3,3,0,0] },
          label: { show: true, position: 'top', fontSize: 10, color: '#8896AE', fontWeight: 600,
            formatter: function(p) { return p.value; } }
        },
        {
          name: '总建联人数',
          type: 'bar', data: connect, barWidth: 18,
          itemStyle: { color: '#D4596B', borderRadius: [3,3,0,0] },
          label: { show: true, position: 'top', fontSize: 11, color: '#B13E4F', fontWeight: 700,
            formatter: function(p) { return p.value > 0 ? p.value : ''; } }
        },
        {
          name: '总激活人数',
          type: 'bar', data: activat, barWidth: 18,
          itemStyle: { color: '#E8955B', borderRadius: [3,3,0,0] },
          label: { show: true, position: 'top', fontSize: 10, color: '#C5703A', fontWeight: 600,
            formatter: function(p) { return p.value > 0 ? p.value : ''; } }
        },
        {
          name: '总指标达成率',
          type: 'line', yAxisIndex: 1, data: achieveRate,
          step: 'middle',
          lineStyle: { color: '#0D9488', width: 3 },
          itemStyle: { color: '#0D9488', borderColor: '#FFFFFF', borderWidth: 2 },
          symbol: 'circle', symbolSize: 9,
          label: {
            show: true, fontSize: 10, color: '#0D9488', fontWeight: 700,
            backgroundColor: 'rgba(255,255,255,0.85)',
            padding: [2,6,2,6], borderRadius: 4,
            formatter: function(p) { return p.value > 0 ? p.value + '%' : ''; }
          }
        }
      ],
      animation: false
    });

    // 导出图片
    var url = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#FFFFFF'
    });

    var link = document.createElement('a');
    link.download = '各战区达成指标_' + dateStr + '.png';
    link.href = url;
    link.click();

    // 清理
    chart.dispose();
    document.body.removeChild(hiddenDiv);

    addMessage('assistant', '已生成「各战区指标达成情况」图表图片并开始下载，请查看下载文件夹。');
  }

  // ===================== FAB CHAT CONTROLS =====================
  var fabBtn = document.getElementById('fabChatBtn');
  var chatWin = document.getElementById('chatWindow');
  var minimizeBtn = document.getElementById('chatMinimizeBtn');
  var closeBtn = document.getElementById('chatCloseBtn');

  fabBtn.addEventListener('click', function() {
    chatWin.style.display = 'flex';
    fabBtn.style.display = 'none';
    fabBtn.classList.remove('minimized-badge');
  });

  minimizeBtn.addEventListener('click', function() {
    chatWin.style.display = 'none';
    fabBtn.style.display = 'flex';
    fabBtn.classList.add('minimized-badge');
  });

  closeBtn.addEventListener('click', function() {
    chatWin.style.display = 'none';
    fabBtn.style.display = 'flex';
    fabBtn.classList.remove('minimized-badge');
  });

})();
