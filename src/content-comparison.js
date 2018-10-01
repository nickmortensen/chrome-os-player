const defaultPresentationId = "2b95b77e-839c-4674-b020-e2198df49061";

module.exports = {
  compareContentData(newData) {
    if (!validateData(newData)) {return Promise.reject(Error('invalid data'));}

    const newPresDates = getPresDatesFromContent(newData);

    const newSchedDate = newData.content.schedule ? {
      "id": newData.content.schedule.id,
      "changeDate": newData.content.schedule.changeDate
    } : {
      "id": "no-schedule",
      "changeDate": "no-schedule"
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
  if (!newData.content.presentations) {return false}
  if (!newData.content.schedule &&
  !isDefaultContentJson(newData.content.presentations)) {return false}

  return true;
}

function isDefaultContentJson(presentations) {
  return Array.isArray(presentations) &&
  presentations.length === 1 &&
  presentations[0].id === defaultPresentationId;
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
