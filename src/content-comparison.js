module.exports = {
  compareContentData(newData) {
    if (!validateData(newData)) {return Promise.reject(Error('invalid data'));}

    const newPresDates = getPresDatesFromContent(newData);

    const newSchedDate = {
      "id": newData.content.schedule.id,
      "changeDate": newData.content.schedule.changeDate
    };

    return new Promise(res=>{
      chrome.storage.local.get(items => {
        chrome.storage.local.set({
          presDates: newPresDates,
          schedDate: newSchedDate
        });

        res({
          aPresentationHasChanged: presDatesChanged(items.presDates, newPresDates),
          theScheduleHasChanged: schedChanged(items.schedDate, newSchedDate)
        });
      });
    });
  },
  presDatesChanged,
  getPresDatesFromContent,
  schedChanged
};

function validateData(newData) {
  if (!newData) {return false}
  if (!newData.content) {return false}
  if (!newData.content.schedule) {return false}
  if (!newData.content.presentations) {return false}

  return true;
}

function getPresDatesFromContent({content}) {
  return content.presentations.map(({id, changeDate})=>({id, changeDate}))
  .reduce((presDates, idAndDate)=>{
    return {
      ...presDates,
      [idAndDate.id]: idAndDate.changeDate
    };
  }, {});
}

function presDatesChanged(oldDates, newDates) {
  if (!oldDates || !newDates) {return}

  return Object.keys(newDates)
  .some(presId=>oldDates[presId] && oldDates[presId] !== newDates[presId]);
}

function schedChanged(oldSched, newSched) {
  if (!oldSched || !newSched) {return}

  const differentSched = oldSched.id !== newSched.id;
  const modifiedSched = oldSched.changeDate !== newSched.changeDate;

  return differentSched || modifiedSched;
}
