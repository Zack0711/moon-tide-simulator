//<!--//<![CDATA[
// Solar Eclipse Calculator for Google Maps (Xavier Jubier: http://xjubier.free.fr/)
//
// Some of the code is inspired by Chris O'Byrne (http://www.chris.obyrne.com/)
//

/*
Release:
2007-07-06    Xavier Jubier, Fred Espenak, Sumit Dutta    Version for NASA's Solar Eclipse Google Maps
2013-12-13    Xavier Jubier                               Clear marker addition, display improvements
2014-03-09    Xavier Jubier                               Added obscuration and cleaned up/improved code
2014-07-17    Xavier Jubier                               Fixed Altitude and No Eclipse button
2015-11-03    Xavier Jubier                               Replaced function getdate
*/

var R2D = 180.0 / Math.PI;
var D2R = Math.PI / 180.0;

//
// Observer constants -
// (0) North Latitude (radians)
// (1) West Longitude (radians)
// (2) Altitude (meters)
// (3) West time zone (hours)
// (4) rho sin O'
// (5) rho cos O'
//
var obsvconst = new Array();

//
// Eclipse circumstances
//   (0) Event type (C1=-2, C2=-1, Mid=0, C3=1, C4=2)
//   (1) t
// -- time-only dependent circumstances (and their per-hour derivatives) follow --
//   (2) x
//   (3) y
//   (4) d
//   (5) sin d
//   (6) cos d
//   (7) mu
//   (8) l1
//   (9) l2
// (10) dx
// (11) dy
// (12) dd
// (13) dmu
// (14) dl1
// (15) dl2
// -- time and location dependent circumstances follow --
// (16) h
// (17) sin h
// (18) cos h
// (19) xi
// (20) eta
// (21) zeta
// (22) dxi
// (23) deta
// (24) u
// (25) v
// (26) a
// (27) b
// (28) l1'
// (29) l2'
// (30) n^2
// -- observational circumstances follow --
// (31) alt
// (32) azi
// (33) m (max eclipse)
// (34) magnitude (max eclipse)
// (35) Moon/Sun ratio (max eclipse only)
// (36) local event type (0 = none, 1 = partial, 2 = annular, 3 = total)
//
var c1 = new Array();
var c2 = new Array();
var mid = new Array();
var c3 = new Array();
var c4 = new Array();

const elements = new Array(
//*** #0U - Input Besselian Elements here
2459021.778650,   7.0,  -4.0,   4.0,    69.4,
    0.15426011,    0.53115284,    0.00002584,   -0.00000693,
    0.13640407,    0.05138711,   -0.00016094,   -0.00000079,
   23.43566895,   -0.00023278,   -0.00000559,
  284.53555298,   14.99911118,    0.00000023,
    0.55233639,   -0.00012230,   -0.00001071,
    0.00614849,   -0.00012169,   -0.00001066,
    0.00460090,    0.00457799
);

// Latitude to text
function latitudeToString(latitude) {
   var txt = "";
   var latt = Math.round(latitude * 10000) / 10000.0;
   if (latt > 0)
      txt = latt + "&deg; N";
   else if (latt < 0) {
      var uneg = -1 * latt;
      txt = uneg + "&deg; S";
   }
   else
      txt = "0&deg;";
   return txt;
}

// Longitude to text
function longitudeToString(longitude) {
   var txt = "";
   var longt = Math.round(longitude * 10000) / 10000.0;
   if (longt > 0)
      txt = longt + "&deg; E";
   else if (longt < 0) {
      var uneg = -1 * longt;
      txt = uneg + "&deg; W";
   }
   else
      txt = "0&deg;";
   return txt;
}

//
// Populate the circumstances array with the time-only dependent circumstances (x, y, d, m, ...)
function timedependent(circumstances) {
   var t = circumstances[1];
   // x
   var ans = elements[8] * t + elements[7];
   ans = ans * t + elements[6];
   ans = ans * t + elements[5];
   circumstances[2] = ans;
   // dx
   ans = 3.0 * elements[8] * t + 2.0 * elements[7];
   ans = ans * t + elements[6];
   circumstances[10] = ans;
   // y
   ans = elements[12] * t + elements[11];
   ans = ans * t + elements[10];
   ans = ans * t + elements[9];
   circumstances[3] = ans;
   // dy
   ans = 3.0 * elements[12] * t + 2.0 * elements[11];
   ans = ans * t + elements[10];
   circumstances[11] = ans;
   // d
   ans = elements[15] * t + elements[14];
   ans = ans * t + elements[13];
   ans = ans * D2R;
   circumstances[4] = ans;
   // sin d and cos d
   circumstances[5] = Math.sin(ans);
   circumstances[6] = Math.cos(ans);
   // dd
   ans = 2.0 * elements[15] * t + elements[14];
   ans = ans * D2R;
   circumstances[12] = ans;
   // m
   ans = elements[18] * t + elements[17];
   ans = ans * t + elements[16];
   if (ans >= 360.0) {
      ans = ans - 360.0;
   }
   ans = ans * D2R;
   circumstances[7] = ans;
   // dm
   ans = 2.0 * elements[18] * t + elements[17];
   ans = ans * D2R;
   circumstances[13] = ans;
   // l1 and dl1
   var type = circumstances[0];
   if ((type == -2) || (type == 0) || (type == 2)) {
      ans = elements[21] * t + elements[20];
      ans = ans * t + elements[19];
      circumstances[8] = ans;
      circumstances[14] = 2.0 * elements[21] * t + elements[20];
   }
   // l2 and dl2
   if ((type == -1) || (type == 0) || (type == 1)) {
      ans = elements[24] * t + elements[23];
      ans = ans * t + elements[22];
      circumstances[9] = ans;
      circumstances[15] = 2.0 * elements[24] * t + elements[23];
   }

   return circumstances;
}

//
// Populate the circumstances array with the time and location dependent circumstances
function timelocdependent(circumstances) {
   timedependent(circumstances);
   // h, sin h, cos h
   circumstances[16] = circumstances[7] - obsvconst[1] - (elements[4] / 13713.44);
   circumstances[17] = Math.sin(circumstances[16]);
   circumstances[18] = Math.cos(circumstances[16]);
   // xi
   circumstances[19] = obsvconst[5] * circumstances[17];
   // eta
   circumstances[20] = obsvconst[4] * circumstances[6] - obsvconst[5] * circumstances[18] * circumstances[5];
   // zeta
   circumstances[21] = obsvconst[4] * circumstances[5] + obsvconst[5] * circumstances[18] * circumstances[6];
   // dxi
   circumstances[22] = circumstances[13] * obsvconst[5] * circumstances[18];
   // deta
   circumstances[23] = circumstances[13] * circumstances[19] * circumstances[5] - circumstances[21] * circumstances[12];
   // u
   circumstances[24] = circumstances[2] - circumstances[19];
   // v
   circumstances[25] = circumstances[3] - circumstances[20];
   // a
   circumstances[26] = circumstances[10] - circumstances[22];
   // b
   circumstances[27] = circumstances[11] - circumstances[23];
   // l1'
   var type = circumstances[0];
   if ((type == -2) || (type == 0) || (type == 2)) {
      circumstances[28] = circumstances[8] - circumstances[21] * elements[25];
   }
   // l2'
   if ((type == -1) || (type == 0) || (type == 1)) {
      circumstances[29] = circumstances[9] - circumstances[21] * elements[26];
   }
   // n^2
   circumstances[30] = circumstances[26] * circumstances[26] + circumstances[27] * circumstances[27];

   return circumstances;
}

//
// Iterate on C1 or C4
function c1c4iterate(circumstances) {
   var sign, n;

   timelocdependent(circumstances);
   if (circumstances[0] < 0)
      sign = -1.0;
   else
      sign = 1.0;
   var tmp = 1.0;
   var iter = 0;
   while (((tmp > 0.000001) || (tmp < -0.000001)) && (iter < 50)) {
      n = Math.sqrt(circumstances[30]);
      tmp = circumstances[26] * circumstances[25] - circumstances[24] * circumstances[27];
      tmp = tmp / n / circumstances[28];
      tmp = sign * Math.sqrt(1.0 - tmp * tmp) * circumstances[28] / n;
      tmp = (circumstances[24] * circumstances[26] + circumstances[25] * circumstances[27]) / circumstances[30] - tmp;
      circumstances[1] = circumstances[1] - tmp;
      timelocdependent(circumstances);
      iter++;
   }

   return circumstances;
}

//
// Get C1 and C4 data
//    Entry conditions -
//    1. The mid array must be populated
//    2. The magnitude at mid eclipse must be > 0.0
function getc1c4() {
   var n = Math.sqrt(mid[30]);
   var tmp = mid[26] * mid[25] - mid[24] * mid[27];
   tmp = tmp / n / mid[28];
   tmp = Math.sqrt(1.0 - tmp * tmp) * mid[28] / n;
   c1[0] = -2;
   c4[0] = 2;
   c1[1] = mid[1] - tmp;
   c4[1] = mid[1] + tmp;
   c1c4iterate(c1);
   c1c4iterate(c4);
}

//
// Iterate on C2 or C3
function c2c3iterate(circumstances) {
   var sign, n;

   timelocdependent(circumstances);
   if (circumstances[0] < 0)
      sign = -1.0;
   else
      sign = 1.0;
   if (mid[29] < 0.0)
      sign = -sign;
   var tmp = 1.0;
   var iter = 0;
   while (((tmp > 0.000001) || (tmp < -0.000001)) && (iter < 50)) {
      n = Math.sqrt(circumstances[30]);
      tmp = circumstances[26] * circumstances[25] - circumstances[24] * circumstances[27];
      tmp = tmp / n / circumstances[29];
      tmp = sign * Math.sqrt(1.0 - tmp * tmp) * circumstances[29] / n;
      tmp = (circumstances[24] * circumstances[26] + circumstances[25] * circumstances[27]) / circumstances[30] - tmp;
      circumstances[1] = circumstances[1] - tmp;
      timelocdependent(circumstances);
      iter++;
   }

   return circumstances;
}

//
// Get C2 and C3 data
//    Entry conditions -
//    1. The mid array must be populated
//    2. There must be either a total or annular eclipse at the location!
function getc2c3() {
   var n = Math.sqrt(mid[30]);
   var tmp = mid[26] * mid[25] - mid[24] * mid[27];
   tmp = tmp / n / mid[29];
   tmp = Math.sqrt(1.0 - tmp * tmp) * mid[29] / n;
   c2[0] = -1;
   c3[0] = 1;
   if (mid[29] < 0.0) {
      c2[1] = mid[1] + tmp;
      c3[1] = mid[1] - tmp;
   }
   else {
      c2[1] = mid[1] - tmp;
      c3[1] = mid[1] + tmp;
   }
   c2c3iterate(c2);
   c2c3iterate(c3);
}

//
// Get the observational circumstances
function observational(circumstances) {
   var contacttype;

   if (circumstances[0] == 0)
      contacttype = 1.0;
   else {
      if ((mid[36] == 3) && ((circumstances[0] == -1) || (circumstances[0] == 1)))
         contacttype = -1.0;
      else
         contacttype = 1.0;
   }
   // alt
   var sinlat = Math.sin(obsvconst[0]);
   var coslat = Math.cos(obsvconst[0]);
   circumstances[31] = Math.asin(circumstances[5] * sinlat + circumstances[6] * coslat * circumstances[18]);
   // azi
   circumstances[32] = Math.atan2(-1.0*circumstances[17]*circumstances[6], circumstances[5]*coslat - circumstances[18]*sinlat*circumstances[6]);
}

//
// Calculate max eclipse
function getmid() {
   mid[0] = 0;
   mid[1] = 0.0;
   var iter = 0;
   var tmp = 1.0;
   timelocdependent(mid);
   while (((tmp > 0.000001) || (tmp < -0.000001)) && (iter < 50)) {
      tmp = (mid[24] * mid[26] + mid[25] * mid[27]) / mid[30];
      mid[1] = mid[1] - tmp;
      iter++;
      timelocdependent(mid);
   }
}

//
// Populate the c1, c2, mid, c3 and c4 arrays
function getall() {
   getmid();
   observational(mid);
   // m, magnitude and moon/sun ratio
   mid[33] = Math.sqrt(mid[24]*mid[24] + mid[25]*mid[25]);
   mid[34] = (mid[28] - mid[33]) / (mid[28] + mid[29]);
   mid[35] = (mid[28] - mid[29]) / (mid[28] + mid[29]);
   if (mid[34] > 0.0) {
      getc1c4();
      if ((mid[33] < mid[29]) || (mid[33] < -mid[29])) {
         getc2c3();
         if (mid[29] < 0.0)
            mid[36] = 3; // Total solar eclipse
         else
            mid[36] = 2; // Annular solar eclipse
         observational(c2);
         observational(c3);
         c2[33] = 999.9;
         c3[33] = 999.9;
      }
      else
         mid[36] = 1; // Partial eclipse
      observational(c1);
      observational(c4);
   }
   else
      mid[36] = 0; // No eclipse
}

//
// Read the data, and populate the obsvconst array
function readdata(lat, lon) {
   // Get the latitude
   obsvconst[0] = lat;
   obsvconst[0] *= 1;
   obsvconst[0] *= D2R;

   // Get the longitude
   obsvconst[1] = lon;
   obsvconst[1] *= -1;
   obsvconst[1] *= D2R;

   // Get the altitude (sea level by default)
   obsvconst[2] = 0;

   // Get the time zone (UT by default)
   obsvconst[3] = 0;

   // Get the observer's geocentric position
   var tmp = Math.atan(0.99664719 * Math.tan(obsvconst[0]));
   obsvconst[4] = 0.99664719 * Math.sin(tmp) + (obsvconst[2] / 6378140.0) * Math.sin(obsvconst[0]);
   obsvconst[5] = Math.cos(tmp) + (obsvconst[2] / 6378140.0 * Math.cos(obsvconst[0]));
}

// This is used in getday()
// Pads digits
function padDigits(n, totalDigits) {
   n = n.toString();
   var pd = '';
   if (totalDigits > n.length) {
      for (let i = 0; i < (totalDigits - n.length); i ++)
         pd += '0';
   }
   return pd + n.toString();
}

// Get the local date
function getdate(circumstances) {      
  var jd, t, ans, a, b, c, d, e, y;

  jd = Math.floor(elements[0] - (elements[1] / 24.0));
  t = circumstances[1] + elements[1] - obsvconst[3] - ((elements[4] - 0.05) / 3600.0);
  if (t < 0.0)
    jd--;
  else if (t >= 24.0)
    jd++;
  if (jd >= 2299160.5)
  {
    a = Math.floor((jd - 1867216.25) / 36524.25);
    a += jd + 1.0 - Math.floor(a / 4.0);
  }
  else
    a = jd;
  b = a + 1525.0;
  c = Math.floor((b - 122.1) / 365.25);
  d = Math.floor(365.25 * c);
  e = Math.floor((b - d) / 30.6001);
  d = b - d - Math.floor(30.6001 * e);
  if (e < 13.5)
    e -= 1;
  else
    e -= 13;
  if (e > 2.5)
    y = c - 4716;
  else
    y = c - 4715;

  return '' + padDigits(y, 4) + '/' + padDigits(e, 2) + '/' + padDigits(Math.floor(d), 2);
}

//
// Get the local time
function gettime(circumstances) {
   var ans = "";

   var t = circumstances[1] + elements[1] - obsvconst[3] - (elements[4] - 0.05) / 3600.0;
   if (t < 0.0)
      t += 24.0;
   else if (t >= 24.0)
      t -= 24.0;
   if (t < 10.0)
      ans += "0";
   ans += Math.floor(t) + ":";
   t = (t * 60.0) - 60.0 * Math.floor(t);
   if (t < 10.0)
      ans += "0";
   ans += Math.floor(t) + ":";
   t = (t * 60.0) - 60.0 * Math.floor(t);
   if (t < 10.0)
      ans += "0";
   ans += Math.floor(t);
   //ans += ".";
   //ans += Math.floor(10.0 * (t - Math.floor(t)));
   // Add an asterix if the altitude is less than zero
   if (circumstances[31] <= 0.0)
      ans += "*";

   return ans;
}

//
// Get the altitude
function getalt( circumstances, language ) {
  var ans = "";
  var t = circumstances[31] * R2D;
  if (Math.abs(t) < 10.0)
  {
     if (t >= 0.0)
      ans += "0";
     else
      ans += "-0";
  }
  else if (Math.abs(t) < 100.0)
  {
    if (t < 0.0)
      ans += "-";
  }
  ans += Math.abs(t).toFixed(1);

  return ans;
}

//
// Get the azimuth
function getazi(circumstances) {
  var ans = "";
  var t = circumstances[32] * R2D;
  if (t < 0.0)
     t += 360.0;
  else if (t >= 360.0)
     t -= 360.0;
  if (t < 10.0)
    ans += "00";
  else if (t < 100.0)
    ans += "0";
  ans += t.toFixed(1);

  return ans;
}

const convertToDateTime = c => {
  const dateArr = getdate(c).split('/');
  const timeArr = gettime(c).split(':');
  return Date.UTC(dateArr[0], dateArr[1]-1, dateArr[2], Number(timeArr[0]), Number(timeArr[1]), Number(timeArr[2]));
}
//
// Display the information about 1st contact
function displayc1() {
  const cDate = new Date(convertToDateTime(c1));

  return `
    <tr>
      <td>
        <label class='label-ec label-c1' data-toggle="tooltip" title="日面與月面第一次外切，偏食開始。">初虧</label>
      </td>
      <td>${cDate.getFullYear()}/${cDate.getMonth()+1}/${cDate.getDate()}</td>
      <td>${cDate.getHours()}:${cDate.getMinutes()}:${cDate.getSeconds()}</td>
      <td>${getalt(c1)}°</td>
      <td>${getazi(c1)}°</td>
    </tr>
  `
}

//
// Display the information about 2nd contact
function displayc2() {
  const cDate = new Date(convertToDateTime(c2));

  return `
    <tr>
      <td>
        <label class='label-ec label-c2' data-toggle="tooltip" title="日面與月面第一次內切，環食開始。">環食始</label>        
      </td>
      <td>${cDate.getFullYear()}/${cDate.getMonth()+1}/${cDate.getDate()}</td>
      <td>${cDate.getHours()}:${cDate.getMinutes()}:${cDate.getSeconds()}</td>
      <td>${getalt(c2)}°</td>
      <td>${getazi(c2)}°</td>
    </tr>
  `
}

//
// Display the information about maximum eclipse
function displaymid() {
  const cDate = new Date(convertToDateTime(mid));

  return `
    <tr>
      <td>
        <label class='label-ec label-mid' data-toggle="tooltip" title="日面中心與月面中心最靠近的時候，也就是掩食程度最大的時刻。">食甚</label>        
      </td>
      <td>${cDate.getFullYear()}/${cDate.getMonth()+1}/${cDate.getDate()}</td>
      <td>${cDate.getHours()}:${cDate.getMinutes()}:${cDate.getSeconds()}</td>
      <td>${getalt(mid)}°</td>
      <td>${getazi(mid)}°</td>
    </tr>
  `
}

//
// Display the information about 3rd contact
function displayc3() {
  const cDate = new Date(convertToDateTime(c3));

  return `
    <tr>
      <td>
        <label class='label-ec label-c3' data-toggle="tooltip" title="日面與月面第二次內切，環食結束。">環食終</label>        
      </td>
      <td>${cDate.getFullYear()}/${cDate.getMonth()+1}/${cDate.getDate()}</td>
      <td>${cDate.getHours()}:${cDate.getMinutes()}:${cDate.getSeconds()}</td>
      <td>${getalt(c3)}°</td>
      <td>${getazi(c3)}°</td>
    </tr>
  `
}

//
// Display the information about 4th contact
function displayc4() {
  const cDate = new Date(convertToDateTime(c4));

  return `
    <tr>
      <td>
        <label class='label-ec label-c4' data-toggle="tooltip" title="日面與月面第二次外切，偏食結束。">復圓</label>        
      </td>
      <td>${cDate.getFullYear()}/${cDate.getMonth()+1}/${cDate.getDate()}</td>
      <td>${cDate.getHours()}:${cDate.getMinutes()}:${cDate.getSeconds()}</td>
      <td>${getalt(c4)}°</td>
      <td>${getazi(c4)}°</td>
    </tr>
  `
}

//
// Get the duration in 00m00.0s format
//
function getduration() {
   var tmp = c3[1] - c2[1];
   if (tmp < 0.0)
      tmp += 24.0;
   else if (tmp >= 24.0)
      tmp -= 24.0;
   tmp = (tmp * 60.0) - 60.0 * Math.floor(tmp) + 0.05 / 60.0;
   var ans = Math.floor(tmp) + "分";
   tmp = (tmp * 60.0) - 60.0 * Math.floor(tmp);
   if (tmp < 10.0)
      ans += "0";
   ans += Math.floor(tmp);
   ans += ".";
   ans += Math.floor((tmp - Math.floor(tmp)) * 10.0).toString() + "秒";

   return ans;
}

//
// Get the obscuration
function getcoverage( language ){
  var a, b, c;

  if (mid[34] <= 0.0){
    if ( language == "fr" )
      return "0,00%";
    else
      return "0.00%";
  }else if (mid[34] >= 1.0){
    if ( language == "fr" )
      return "100,00%";
    else
      return "100.00%";
  }
  if (mid[36] == 2)
    c = mid[35] * mid[35];
  else
  {
    c = Math.acos((mid[28] * mid[28] + mid[29] * mid[29] - 2.0 * mid[33] * mid[33]) / (mid[28] * mid[28] - mid[29] * mid[29]));
    b = Math.acos((mid[28] * mid[29] + mid[33] * mid[33]) / mid[33] / (mid[28] + mid[29]));
    a = Math.PI - b - c;
    c = ((mid[35] * mid[35] * a + b) - mid[35] * Math.sin(c)) / Math.PI;
  }
  var ans = (c * 100).toFixed(2);
  if ( language == "fr" )
    ans = ans.replace(/\./, ',');
  ans += "%";

  return ans;
}

//
// Compute the local circumstances
const loc_circ = (lat, lon) => {
   var html = "";
   var htmlc1 = "";
   var htmlc2 = "";
   var htmlmid = "";
   var htmlc3 = "";
   var htmlc4 = "";
   var htmlEclipse = "";
   var partialEvent = false;
   var isEclipse = true;

   var eclipseDate = {};

   readdata(lat, lon);
   getall();
   htmlmid = displaymid();
   if (mid[36] > 0) {
      // There is an eclipse
      htmlc1 = displayc1();
      htmlc4 = displayc4();
      if (mid[36] > 1) {
         // Total/annular eclipse
         htmlc2 = displayc2();
         htmlc3 = displayc3();
         if ((c1[31] <= 0.0) && (c4[31] <= 0.0)) {
            // Sun below the horizon for the entire duration of the event
            isEclipse = false;
            htmlEclipse += "No&nbsp;Solar&nbsp;Eclipse";
         }
         else {
            // Sun above the horizon for at least some of the event
            if ((c2[31] <= 0.0) && (c3[31] <= 0.0)) {
              //if ((c2[31] <= -0.15) && (c3[31] <= -0.15) {
               // Sun below the horizon for just the total/annular event
               partialEvent = true;
               htmlEclipse += "Partial&nbsp;Solar&nbsp;Eclipse";
            }
            else {
               // Sun above the horizon for at least some of the total/annular event
                //if ((c2[31] > 0.0) && (c3[31] > 0.0)) {
               if ((c2[31] > -0.1) && (c3[31] > -0.1)) {
                  // Sun above the horizon for the entire annular/total event
                  if (mid[36] == 2) {
                     htmlEclipse += "日環食";
                     htmlEclipse += "<br/>日環食持續時間：";
                     htmlc1 = htmlc1.replace("&nbsp;of&nbsp;central&nbsp;eclipse", "&nbsp;of&nbsp;annular&nbsp;eclipse");
                     htmlc2 = htmlc2.replace("&nbsp;of&nbsp;central&nbsp;eclipse", "&nbsp;of&nbsp;annular&nbsp;eclipse");
                     htmlc3 = htmlc3.replace("&nbsp;of&nbsp;central&nbsp;eclipse", "&nbsp;of&nbsp;annular&nbsp;eclipse");
                     htmlc4 = htmlc4.replace("&nbsp;of&nbsp;central&nbsp;eclipse", "&nbsp;of&nbsp;annular&nbsp;eclipse");
                  }
                  else {
                     htmlEclipse += "Total&nbsp;Solar&nbsp;Eclipse";
                     htmlEclipse += "<br />Duration&nbsp;of&nbsp;Totality:&nbsp;";
                     htmlc1 = htmlc1.replace("&nbsp;of&nbsp;central&nbsp;eclipse", "&nbsp;of&nbsp;total&nbsp;eclipse");
                     htmlc2 = htmlc2.replace("&nbsp;of&nbsp;central&nbsp;eclipse", "&nbsp;of&nbsp;total&nbsp;eclipse");
                     htmlc3 = htmlc3.replace("&nbsp;of&nbsp;central&nbsp;eclipse", "&nbsp;of&nbsp;total&nbsp;eclipse");
                     htmlc4 = htmlc4.replace("&nbsp;of&nbsp;central&nbsp;eclipse", "&nbsp;of&nbsp;total&nbsp;eclipse");
                  }
                  htmlEclipse += getduration();
               }
               else {
                  // Sun below the horizon for at least some of the annular/total event
                  htmlEclipse += "???";
               }
            }
         }
      }
      else {
         // Partial eclipse
         if ((c1[31] <= 0.0) && (c4[31] <= 0.0)) {
            // Sun below the horizon
            isEclipse = false;
            htmlEclipse += "No Solar Eclipse";
         }
         else {
            partialEvent = true;
            htmlEclipse += "Partial Solar Eclipse";
         }
      }
   }
   else {
      // No eclipse
      isEclipse = false;
      htmlEclipse += "No Solar Eclipse";
   }

   if (isEclipse == true) {

      var maxmag = Math.round(mid[34] * 1000) / 1000.0;
      htmlEclipse += "<br/>最大食分：" + maxmag;
      htmlEclipse += "<br/>掩食面積比率：" + getcoverage();

      html = "";
      html += "<div id=\"mapmarker\">";
      html += "<table class='table'>";
      html += "<thead><tr>";      
      if (typeof gCurrentMarker != "undefined")
      {
        if (gCurrentMarker != null)
          html += "<td><span title=\"Latitude\">緯度</span>:&nbsp;" + latitudeToString(lat.toFixed(5)) + "<br/><span title=\"Longitude\">經度</span>:&nbsp;" + longitudeToString(lon.toFixed(5)) + ((mid[36] >= 2) ? "<br />" : "") + "<br/><input type=\"button\" id=\"clearmark\" value=\"Clear Marker\" onclick=\"clearMarker();\"></td>";
        else
          html += "<td><span title=\"Latitude\">緯度</span>:&nbsp;" + latitudeToString(lat.toFixed(5)) + "<br/><span title=\"Longitude\">經度</span>:&nbsp;" + longitudeToString(lon.toFixed(5)) + "</td>";
      }
      else
        html += "<td><span title=\"Latitude\">緯度</span>:&nbsp;" + latitudeToString(lat.toFixed(5)) + "<br/><span title=\"Longitude\">經度</span>:&nbsp;" + longitudeToString(lon.toFixed(5)) + "</td>";
      html += "<td>" + htmlEclipse + "</td>";
      html += "</tr></thead>";
      html += "</table>";

      html += `
        <table class='table'>
          <thead>
            <tr>
              <th>日食階段</th><th>日期</th><th>時間</th><th>高度角</th><th>方位角</th>
            </tr>
          </thead>
          <tbody>
      `
      html += htmlc1;
      if (partialEvent == false)
         html += htmlc2;
      html += htmlmid;
      if (partialEvent == false)
         html +=htmlc3;
      html += htmlc4;
      html += "</tbody></table></div>";
   }
   else {
      // No eclipse
      html = "<div id=\"mapmarker\">";
      html += "<table class='table'>";
      html += "<thead><tr>";
      if (typeof gCurrentMarker != "undefined")
      {
        if (gCurrentMarker != null)
          html += "<td><span title=\"Latitude\">緯度</span>:&nbsp;" + latitudeToString(lat.toFixed(5)) + "<br/><span title=\"Longitude\">經度</span>:&nbsp;" + longitudeToString(lon.toFixed(5)) + "<br/><input type=\"button\" id=\"clearmark\" value=\"Clear Marker\" onclick=\"clearMarker();\"></td>";
        else
          html += "<td><span title=\"Latitude\">緯度</span>:&nbsp;" + latitudeToString(lat.toFixed(5)) + "<br/><span title=\"Longitude\">經度</span>:&nbsp;" + longitudeToString(lon.toFixed(5)) + "</td>";
      }
      else
        html += "<td><span title=\"Latitude\">緯度</span>:&nbsp;" + latitudeToString(lat.toFixed(5)) + "<br/><span title=\"Longitude\">經度</span>:&nbsp;" + longitudeToString(lon.toFixed(5)) + "</td>";
      html += "</tr></thead>";
      html += "</table>";
      html += "<br/><p style=\"font-weight: bold;\">" + htmlEclipse + "</p>";
   }
   html += "</div>";

   eclipseDate['c1'] = convertToDateTime(c1);
   eclipseDate['c2'] = convertToDateTime(c2);
   eclipseDate['mid'] = convertToDateTime(mid);
   eclipseDate['c3'] = convertToDateTime(c3);
   eclipseDate['c4'] = convertToDateTime(c4);

   return {html, eclipseDate};
}

export {
  loc_circ,
}

