import externalConnectionsService from '../externalConnections/externalConnections-service.js';
import moment from 'moment';

class issueServices {
  async updateIssue(id, fields) {
    const issues = await externalConnectionsService.updateIssue(id, fields);
    return issues
  }




  async getPlanOnDate(keys, params) {

    const dayOfOnPlan = await moment(params.dateFirst);
    const result = [];

    for (const issueKey of keys) {

      const issue = await externalConnectionsService.getIssueByIDAgile(issueKey);
      const firstRow = {
        value: "done date",
        valueId: "",
        start: moment(issue.fields.created),
        end: null
      }



      const tableOfStatus = await getArrayOfStatus(issue.changelog.histories, firstRow, params.endDateFieldName.toLowerCase());
      let DoneDateOnDate = undefined;
      let WFCDateOnDate = undefined;
      for (const row of tableOfStatus) {
        if (dayOfOnPlan.isBetween(row.start, row.end)) {
          DoneDateOnDate = await moment(row.valueId).format("DD-MM-YYYY");
        }
      }
      const tableOfStatusWfc = getArrayOfStatus(issue.changelog.histories, firstRow, params.startDateFieldName.toLowerCase())

      for (const row of tableOfStatusWfc) {
        if (dayOfOnPlan.isBetween(row.start, row.end)) {
          WFCDateOnDate = await moment(row.valueId).format("DD-MM-YYYY");
        }
      }
      const WFCDateCurrent = moment(issue.fields[params.startDateField]).format("DD-MM-YYYY")
      const DoneDateCurrent = moment(issue.fields[params.endDateField]).format("DD-MM-YYYY")
      const ResolvedDate = moment(issue.fields.resolutiondate).format("DD-MM-YYYY")
      const key = issue.key

      result.push({
        key,
        name: issue.fields.summary,
        WFCDateOnDate,
        WFCDateCurrent,
        DoneDateOnDate,
        DoneDateCurrent,
        ResolvedDate,
      });


    }

    console.log(result)
    return result
  }

  async calculatePlan(keys, params) {
    const issues = await externalConnectionsService.getIssuesByID(keys);

    const planningLT = new Map(
      params.planningLT.map(object => {
        return [object.name, object.duration];
      }),
    );

    const arrayOfIssueAndBlockersLink = []
    let rankUS = 0;
    for (const issue of issues) {
      rankUS++
      const obj = {
        key: issue.key,
        name: issue.fields.summary,
        issuetype: issue.fields.issuetype.name,
        rank: issue.fields.customfield_10015,
        StartOld: moment(issue.fields[params.startDateField]),
        EndOld: moment(issue.fields[params.endDateField]),
        diff: moment(issue.fields[params.endDateField]).diff(moment(issue.fields[params.startDateField])) / (24 * 3600 * 1000),
        rankUS,
      }

      obj.blockersLinks = []
      for (const link of issue.fields.issuelinks) {
        if (link.type?.id == "10000" && link.inwardIssue && link.inwardIssue.fields.status.statusCategory.id != 3) {
          obj.blockersLinks.push({
            key: link.inwardIssue.key,
            type: link.inwardIssue.fields.issuetype.name,
            status: link.inwardIssue.fields.status.name,
            name: link.inwardIssue.fields.summary
          })
        }

      }
      arrayOfIssueAndBlockersLink.push(obj)
    }
    params.planningLT = planningLT
    const newPlan = calculatePlans(arrayOfIssueAndBlockersLink, params)
    const planView = []

    for (const issue of newPlan) {
      const changeDate = !(issue.StartNew.format("DD.MM.YYYY") == issue.StartOld.format("DD.MM.YYYY"))
      planView.push({
        key: issue.key,
        name: issue.name,
        issuetype: issue.issuetype,
        Start: issue.StartNew.format("DD.MM.YYYY"),
        End: issue.EndNew.format("DD.MM.YYYY"),
        StartJira: issue.StartNew.format("YYYY-MM-DD"),
        EndJira: issue.EndNew.format("YYYY-MM-DD"),
        StartOld: issue.StartOld.format("DD.MM.YYYY"),
        EndOld: issue.EndOld.format("DD.MM.YYYY"),
        maxDay: issue.maxDay?.format("DD.MM.YYYY"),
        blockersLinks: issue.blockersLinks,
        changeDate,
        rank: issue.rankUS
      })
    }
    let WIPTimeLine = undefined
    const currentDay = moment()
    if (params.calculateLimitToDays && params.calculateLimitToDays > 0) {
      WIPTimeLine = []
      for (let index = 0; index <= params.calculateLimitToDays; index++) {
        currentDay.add(1, "days");
        WIPTimeLine.push({
          date: currentDay.format("DD/MM/YYYY"),
          day: index,
          WIPCount: calculateWIP(newPlan, currentDay)
        })
      }
    }
    console.log("Длинна массива входящего:", keys.length)
    console.log("Длинна массива исходящего:", planView.length)
    if (params.updateIssuesDates) {
      console.log("Обновляем Issue в Jira:")
      for (const issue of planView) {
        if (issue.changeDate) {
          const fields = {};
          fields[params.startDateField] = issue.StartJira
          fields[params.startDateField] = issue.EndJira
          await externalConnectionsService.updateIssue(issue.key, fields);
        }
      }
      console.log("Обновили Issue в Jira:")
    }
    return { planView, WIPTimeLine }
  }


}

const calculatePlans = (arrayOfIssues, params) => {
  let currentDay = moment().startOf("week").add(7 + params.dayToRenewal, "days")
  arrayOfIssues = clearBlokerListFrom(arrayOfIssues);

  const { issesAllreadyStart, issuesToCalculateLater } = getIssueAllReadyInSystem(arrayOfIssues, moment().startOf("day"))

  let outputPlan = issesAllreadyStart
  let issuesToCalculate = issuesToCalculateLater
  let issueWillGoLater = []
  let doNextIterations = true
  issuesToCalculate.sort((a, b) => {
    if (a.rankUS > b.rankUS) {
      return 1;
    } else {
      return -1;
    }
  })
  while (doNextIterations) {

    ({ outputPlan, issueWillGoLater } = AddToPlanOnCurrentDay(outputPlan, issuesToCalculate, currentDay, params))

    if (issueWillGoLater.length === 0) {
      doNextIterations = false
    }
    currentDay.add(7 - currentDay.weekday() + params.dayToRenewal, "days");
    issuesToCalculate = issueWillGoLater.concat()

    issuesToCalculate.sort((a, b) => {
      if (a.rankUS > b.rankUS) {
        return 1;
      } else {
        return -1;
      }
    })

  }

  return outputPlan
}

const clearBlokerListFrom = (array) => {
  for (const issue of array) {

    if (!Array.isArray(issue.blockersLinks) || issue.blockersLinks.length === 0) {
      continue
    }

    const blockersLinks = []

    let bloker = issue.blockersLinks.shift()
    while (bloker) {
      const Issues = array.filter((element) => {
        return element.key === bloker.key
      })
      if (Issues.length > 0) {
        blockersLinks.push(bloker)
      }
      bloker = issue.blockersLinks.shift()
    }
    issue.blockersLinks = blockersLinks
  }
  return array
}

const getIssueAllReadyInSystem = (arrayOfIssues, currentDay) => {
  const issuesToCalculateLater = arrayOfIssues.concat()

  const issesAllreadyStart = []
  for (let index = 0; index < issuesToCalculateLater.length; index++) {
    const currentIssue = issuesToCalculateLater.shift()
    if (currentDay.isAfter(currentIssue.StartOld)) {
      currentIssue.StartNew = currentIssue.StartOld
      currentIssue.EndNew = currentIssue.EndOld
      issesAllreadyStart.push(currentIssue)
    } else {
      issuesToCalculateLater.push(currentIssue)
    }
  }

  return { issesAllreadyStart, issuesToCalculateLater }
}

const AddToPlanOnCurrentDay = (issuesPlan, processedIssues, currentDay, params) => {
  const outputPlan = issuesPlan.concat()
  const processedArray = processedIssues.concat()
  const issueWillGoLater = []
  while (processedArray.length > 0) {
    const currentIssue = processedArray.shift()

    const WIPonCurrentDate = calculateWIP(outputPlan, currentDay);
    if (WIPonCurrentDate < params.wiplimits) {

      let maxDay = GetMaxdayFromBlockersList(outputPlan, currentIssue.blockersLinks)

      if (maxDay && currentDay.isAfter(maxDay)) {
        currentIssue.maxDay = maxDay
        currentIssue.StartNew = moment(currentDay)
        currentIssue.EndNew = moment(currentDay).add(params.planningLT.get(currentIssue.issuetype), "days")
        outputPlan.push(currentIssue)
      } else if (maxDay) {

        currentIssue.maxDay = moment(maxDay)
        while (calculateWIP(issuesPlan, maxDay) >= params.wiplimits || maxDay.weekday() !== params.dayToRenewal) {
          maxDay = maxDay.add(7 - maxDay.weekday() + params.dayToRenewal, "days");
        }
        currentIssue.StartNew = moment(maxDay)
        currentIssue.EndNew = moment(maxDay).add(params.planningLT.get(currentIssue.issuetype), "days")
        outputPlan.push(currentIssue);
      } else {
        issueWillGoLater.push(currentIssue);
      }

    } else {
      issueWillGoLater.push(currentIssue)
    }

  }
  return { outputPlan, issueWillGoLater }
}

const GetMaxdayFromBlockersList = (array, keys) => {

  let MaxDay = moment().startOf("year")
  if (!Array.isArray(keys) || keys.length === 0) {
    return MaxDay
  }

  let findDate = false
  for (const blockerLink of keys) {
    for (const IssueLink of array) {
      const endDate = IssueLink.EndNew ?? moment().add(10, "year")
      if (IssueLink.key == blockerLink.key && MaxDay.isBefore(endDate)) {
        MaxDay = endDate
        findDate = true
      }
    }
  }
  if (findDate) {
    return MaxDay
  } else {
    return undefined
  }
}

const calculateWIP = (array, day) => {

  let count = 0;

  for (const issue of array) {

    const StartNew = issue.StartNew ? moment(issue.StartNew) : moment().add(15, "years")
    const EndNew = issue.EndNew ? moment(issue.EndNew) : moment().add(15, "years")

    if (day.isBetween(StartNew, EndNew, 'days', '[]')) {
      count++;
    }
  }

  return count
}

const getArrayOfStatus = (changeLog, FirstRow) => {
  const newArray = [];
  if (!Array.isArray(changeLog)) {
    return null;
  }

  let row = { ...FirstRow };
  let firstElement = true;
  let pushFinalRow = true;

  for (const item of changeLog) {
    for (const itemField of item.items) {
      if (itemField.field.toLowerCase() === 'status') {
        if (firstElement) {

          newArray.push({
            value: itemField.fromString,
            valueId: itemField.from,
            start: FirstRow.start,
            end: moment(item.created)
          });

          row = {
            value: itemField.toString,
            valueId: itemField.to,
            start: moment(item.created)
          };
          firstElement = false;
        }

        if (row?.value !== itemField.toString) {
          if (row) {
            row.end = moment(item.created);
            newArray.push({ ...row });
            pushFinalRow = false;
            if (itemField.toString) {
              row = {
                value: itemField.toString,
                valueId: itemField.to,
                start: moment(item.created),
                end: undefined,
              };
              pushFinalRow = true;
            }
          }
        }
      }
    }
  }
  if (pushFinalRow) {
    if (row.end && row.valueId === 6) {
      row.end = row.start;
    }
    newArray.push(row);
  }
  return newArray;
};

export default new issueServices();
