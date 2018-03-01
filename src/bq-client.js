
const config = {
  refreshUrl: 'https://www.googleapis.com/oauth2/v3/token?client_id=1088527147109-6q1o2vtihn34292pjt4ckhmhck0rk0o7.apps.googleusercontent.com&client_secret=nlZyrcPLg6oEwO9f9Wfn29Wh&refresh_token=1/xzt4kwzE1H7W9VnKB8cAaCx6zb4Es4nKEoqaYHdTD15IgOrJDtdun6zK6XiATCKT&grant_type=refresh_token',
  serviceUrl: 'https://www.googleapis.com/bigquery/v2/projects/client-side-events/datasets/ChromeOS_Player_Events/tables/events/insertAll',
  insertSchema: {
    kind: 'bigquery#tableDataInsertAllRequest',
    skipInvalidRows: false,
    ignoreUnknownValues: false,
    rows: [
      {
        insertId: "",
        json: {
          event: "",
          display_id: "",
          event_details: "",
          ts: 0
        }
      }
    ]
  },
  tokenValidity: 3580000
}

let refreshDate = 0,
  token = '';

function refreshToken(nowDate) {
  if (nowDate - refreshDate < config.tokenValidity) {
    return Promise.resolve(token);
  }

  return fetch(config.refreshUrl, {method: 'POST'})
    .then(resp => resp.json())
    .then(json => {
      refreshDate = nowDate;
      token = json.access_token;
    });
}


function insert(data) {
  const nowDate = new Date();

  return refreshToken(nowDate).then(() => {
    const insertData = config.insertSchema;
    const row = insertData.rows[0];
    row.insertId = Math.random().toString(36).substr(2).toUpperCase(); // eslint-disable-line no-magic-numbers
    row.json = data;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(insertData)
    };

    return fetch(config.serviceUrl, options)
      .then(res => res.json())
      .then((json)=>{
        if (!json.insertErrors || json.insertErrors.length === 0) {return Promise.resolve();}
        return Promise.reject(json.insertErrors);
      });
  });
}

module.exports = {
  insert
}
