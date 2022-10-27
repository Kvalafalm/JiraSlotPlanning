import jiraConnections from './externalConnections-jiraServer.js';
import config from 'config';


class externalConnectionsService {
  constructor() {
    this.LoadConnectionData()
  }

  async getIssuesByID(keys) {

    if (!this.connetion) {
      return undefined
    }

    const fields = [
      'issuelinks',
      'issuetype',
      'customfield_12604',
      'customfield_12603',
      'customfield_10015',
      'key',
      'created',
      'summary',
    ];
    const expand = [
      'changelog'
    ]
    const maxResult = 50;
    let issuesAll = [];
    for (let index = 0; index < keys.length / maxResult; index++) {
      const params = {
        startAt: index * maxResult,
        maxResult,
      };
      const { issues } = await this.connetion.getIssuesByID(
        keys,
        fields,
        expand,
        params
      );
      issuesAll = await issuesAll.concat(issues);
    }

    return issuesAll;
  }

  async getIssueByIDAgile(key) {

    if (!this.connetion) {
      return undefined
    }


    const result = await this.connetion.getIssueByIDAgile(
      key
    );


    return result;
  }

  async getIssuesKeyFromKanbanBoard(params) {

    if (!this.connetion) {
      return undefined
    }

    let jql = '';
    const fields = ['key'];

    if (params.choiceByUpdateDate) {
      jql = `updatedDate%20%20%3E%3D%20%22${params.StartDate.format(
        'YYYY-MM-DD'
      )}%22%20AND%20updatedDate%20%20%3C%3D%20%20%22${params.EndDate.format(
        'YYYY-MM-DD'
      )}%22%20`;
    } else {
      jql = `createdDate%20%20%3E%3D%20%22${params.StartDate.format(
        'YYYY-MM-DD'
      )}%22%20AND%20createdDate%20%20%3C%3D%20%20%22${params.EndDate.format(
        'YYYY-MM-DD'
      )}%22%20`;
    }

    const issues = await this.connetion.getIssuesKeyFromKanbanBoard(
      params.idboard,
      fields,
      jql
    );

    return issues;
  }

  async getCommentsByIdIssue(id) {

    if (!this.connetion) {
      return undefined
    }

    const { comments } = await this.connetion.getCommentsByIdIssue(id);
    return comments;
  }

  async getIssuesWorklogByIdIssue(id) {

    if (!this.connetion) {
      return undefined
    }

    const { worklogs } = await this.connetion.getWorklogByIdIssue(id);
    return worklogs;
  }

  async getProjectStatuses(id) {

    if (!this.connetion) {
      return undefined
    }

    const data = await this.connetion.getProjectStatuses(id);
    let statuses = [];
    for (const issueType of data) {
      for (const status of issueType.statuses) {
        statuses.push({
          name: status.name,
          id: status.id,
          typeOfStatus: status.statusCategory.id,
        });
      }
    }

    let tmpArray = [];
    const itemCheck = item => {
      if (tmpArray.indexOf(item.name) === -1) {
        tmpArray.push(item.name);
        return true;
      }
      return false;
    };

    const uniqueStatuses = statuses.filter(item => itemCheck(item));
    return uniqueStatuses;
  }

  async getProjectList() {
    if (!this.connetion) {
      return undefined
    }
    const data = await this.connetion.getProjectList();
    return data;
  }

  LoadConnectionData() {
    const param = {
      externalServiceURL: config.get('jiraURL'),
      externalServiceType: config.get('jiraType'),
      login: config.get('jiraLogin'),
      password: config.get('jiraPassowrd'),
    }
    this.URL = config.get('jiraURL');
    this.type = config.get('jiraType');
    this.login = config.get('jiraLogin');
    this.password = config.get('jiraPassowrd');

    this.connetion = getConnector(param.externalServiceType, param)

  }

  async updateIssue(id, fields) {
    if (!this.connetion) {
      return undefined
    }
    const data = await this.connetion.updateIssue(id, fields);
    return data;
  }



}

const getConnector = (externalServiceType, param) => {
  let connection
  switch (externalServiceType) {
    case ConnectionTypes.JIRA82:
      connection = new jiraConnections(param)
      break;
    case ConnectionTypes.JIRACLOUD:
      break;
    case ConnectionTypes.KAITEN:
      break;
    default:
      connection = new jiraConnections(param)
      break;
  }
  return connection
}

export const ConnectionTypes = {
  JIRA82: "Connection.jira8.2",
  JIRACLOUD: "Connection.jiraCloud",
  KAITEN: "Connection.kaiten",
}


/* export interface ExternalConnector {
  getIssuesByID: Function;
  getIssuesKeyFromKanbanBoard: Function;
  getCommentsByIdIssue: Function;
  getWorklogByIdIssue: Function;
  getProjectStatuses: Function;
  getProjectList: Function;
  onChange(name: string): any
  
} */

export default new externalConnectionsService();
