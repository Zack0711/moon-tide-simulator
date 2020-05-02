const locationList = [
  {
    title: '嘉義鐵道藝術村',
    position: {lat: 23.4811899, lng: 120.4419393},
    index: '467480',
  },
  {
    title: '故宮南院',
    position: {lat: 23.473516, lng: 120.2923827},
    index: 'C0M740',
  },
  {
    title: '高跟鞋教堂',
    position: {lat: 23.377093, lng: 120.147756},
    index: 'C0M750',
  },
  {
    title: '劍湖山世界主題樂園',
    position: {lat: 23.6202176, lng: 120.577039},
    index: 'C0K490',
  },
  {
    title: '阿里山火車站',
    position: {lat: 23.5102602, lng: 120.804109},
    index: '467530',
  },
  {
    title: '三仙台燈塔',
    position: {lat: 23.1232284, lng: 121.4082564},
    index: '467610',
  },
/*
  {
    title: '金城國中',
    position: {lat: 24.4313036, lng: 118.31294},
    index: 'C0W150',
  },
  {
    title: '奎壁山摩西分海',
    position: {lat: 23.5996608, lng: 119.6713901},
    index: 'noData',
  },  
*/
]

const locationData = {
  'noData': {
    month: [],
    day: [],
  },
  '467480': {
    month: [
      'data/467480/month/467480-2014-06.csv', 
      'data/467480/month/467480-2015-06.csv',
      'data/467480/month/467480-2016-06.csv',
      'data/467480/month/467480-2017-06.csv',
      'data/467480/month/467480-2018-06.csv',
      'data/467480/month/467480-2019-06.csv',
    ],
    day: [
      'data/467480/day/467480-2014-06-21.csv', 
      'data/467480/day/467480-2015-06-21.csv',
      'data/467480/day/467480-2016-06-21.csv',
      'data/467480/day/467480-2017-06-21.csv',
      'data/467480/day/467480-2018-06-21.csv',
      'data/467480/day/467480-2019-06-21.csv',
    ]
  },
  'C0M740': {
    month: [
      'data/C0M740/month/C0M740-2015-06.csv',
      'data/C0M740/month/C0M740-2016-06.csv',
      'data/C0M740/month/C0M740-2017-06.csv',
      'data/C0M740/month/C0M740-2018-06.csv',
      'data/C0M740/month/C0M740-2019-06.csv',
    ],
    day: [
      'data/C0M740/day/C0M740-2015-06-21.csv',
      'data/C0M740/day/C0M740-2016-06-21.csv',
      'data/C0M740/day/C0M740-2017-06-21.csv',
      'data/C0M740/day/C0M740-2018-06-21.csv',
      'data/C0M740/day/C0M740-2019-06-21.csv',
    ]
  },
  'C0M750': {
    month: [
      'data/C0M750/month/C0M750-2015-06.csv',
      'data/C0M750/month/C0M750-2016-06.csv',
      'data/C0M750/month/C0M750-2017-06.csv',
      'data/C0M750/month/C0M750-2018-06.csv',
      'data/C0M750/month/C0M750-2019-06.csv',
    ],
    day: [
      'data/C0M750/day/C0M750-2015-06-21.csv',
      'data/C0M750/day/C0M750-2016-06-21.csv',
      'data/C0M750/day/C0M750-2017-06-21.csv',
      'data/C0M750/day/C0M750-2018-06-21.csv',
      'data/C0M750/day/C0M750-2019-06-21.csv',
    ]
  },
  'C0K490': {
    month: [
      'data/C0K490/month/C0K490-2015-06.csv',
      'data/C0K490/month/C0K490-2016-06.csv',
      'data/C0K490/month/C0K490-2017-06.csv',
      'data/C0K490/month/C0K490-2018-06.csv',
      'data/C0K490/month/C0K490-2019-06.csv',
    ],
    day: [
      'data/C0K490/day/C0K490-2015-06-21.csv',
      'data/C0K490/day/C0K490-2016-06-21.csv',
      'data/C0K490/day/C0K490-2017-06-21.csv',
      'data/C0K490/day/C0K490-2018-06-21.csv',
      'data/C0K490/day/C0K490-2019-06-21.csv',
    ]
  },
  '467530': {
    month: [
      'data/467530/month/467530-2014-06.csv',
      'data/467530/month/467530-2015-06.csv',
      'data/467530/month/467530-2016-06.csv',
      'data/467530/month/467530-2017-06.csv',
      'data/467530/month/467530-2018-06.csv',
      'data/467530/month/467530-2019-06.csv',
    ],
    day: [
      'data/467530/day/467530-2014-06-21.csv',
      'data/467530/day/467530-2015-06-21.csv',
      'data/467530/day/467530-2016-06-21.csv',
      'data/467530/day/467530-2017-06-21.csv',
      'data/467530/day/467530-2018-06-21.csv',
      'data/467530/day/467530-2019-06-21.csv',
    ]
  },
  '467610': {
    month: [
      'data/467610/month/467610-2014-06.csv',
      'data/467610/month/467610-2015-06.csv',
      'data/467610/month/467610-2016-06.csv',
      'data/467610/month/467610-2017-06.csv',
      'data/467610/month/467610-2018-06.csv',
      'data/467610/month/467610-2019-06.csv',
    ],
    day: [
      'data/467610/day/467610-2014-06-21.csv',
      'data/467610/day/467610-2015-06-21.csv',
      'data/467610/day/467610-2016-06-21.csv',
      'data/467610/day/467610-2017-06-21.csv',
      'data/467610/day/467610-2018-06-21.csv',
      'data/467610/day/467610-2019-06-21.csv',
    ]
  },
  'C0W150': {
    month: [
      'data/C0W150/month/C0W150-2017-06.csv',
      'data/C0W150/month/C0W150-2018-06.csv',
      'data/C0W150/month/C0W150-2019-06.csv',
    ],
    day: [
      'data/C0W150/day/C0W150-2017-06-21.csv',
      'data/C0W150/day/C0W150-2018-06-21.csv',
      'data/C0W150/day/C0W150-2019-06-21.csv',
    ]
  },
}

export {
  locationList,
  locationData,
}