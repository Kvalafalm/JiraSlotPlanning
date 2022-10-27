import fetch from 'node-fetch';
import ApiError from '../../utils/exceptions/api_error';

/* const authToken = btoa(
  `${config.get('jiraUser')}:${config.get('jiraPassword')}`
); */

class jiraConnections {

  constructor(param) {
    this.URL = param.externalServiceURL;
    this.name = "JiraServer";
    this.authToken = btoa(
      `${param.login}:${param.password}`
    )
  }
  async updateIssue(id, fields) {

    if (this.needReloadService) {
      throw this.lastError
    }

    const requestUrl = `${this.URL}/rest/api/2/issue/${id}?notifyUsers=false`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.authToken}`,
    };

    const body = {
      fields: { ...fields },
    };

    const options = {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: headers,
    };

    const response = await fetch(requestUrl, options);
    await this.checkAnswer(response);
    try {
      //const data = await response.json();
      if (response.status === 204) {
        await console.log(response)
        return response;
      } else {
        throw ApiError.BadRequest('Something went wrong when try to update issue 1', error);
      }

    } catch (error) {
      console.log(error);
      throw ApiError.BadRequest('Something went wrong when try to establish connection 2', error);
    }
  }

  async getIssuesByID(issuesList, fields = '', expand = undefined, params) {

    if (this.needReloadService) {
      throw this.lastError
    }

    const requestUrl = `${this.URL}/rest/api/latest/search`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.authToken}`,
    };

    const body = {
      jql: `key in (${issuesList.join(',')}) ORDER BY rank ASC`,
      maxResults: params.maxResults,
      fields,
      expand,
      startAt: params.startAt,
    };
    const options = {
      method: 'POST',
      body: JSON.stringify(body),
      headers: headers,
    };
    const response = await fetch(requestUrl, options);
    await this.checkAnswer(response);
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      throw ApiError.BadRequest('Something went wrong when try to establish connection', error);
    }
  }

  async getIssueByIDAgile(key) {

    if (this.needReloadService) {
      throw this.lastError
    }

    const requestUrl = `${this.URL}/rest/agile/1.0/issue/${key}?expand=changelog`
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.authToken}`,
    };

    const options = {
      method: 'GET',
      headers: headers,
    };

    const response = await fetch(requestUrl, options);
    await this.checkAnswer(response);
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      throw ApiError.BadRequest('Something went wrong when try to establish connection', error);
    }
  }

  async getIssuesKeyFromKanbanBoard(idboard, fields, jql) {

    if (this.needReloadService) {
      throw this.lastError
    }

    //jira.lcgs.ru/rest/agile/1.0/board/229/issue?expand=changelog
    const maxResults = 1000;
    const startAt = 0;
    const requestUrl = `${this.URL}/rest/agile/1.0/board/${idboard}/issue?jql=${jql}&fields=${fields}&maxResults=${maxResults}`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.authToken}`,
    };

    const options = {
      method: 'GET',
      headers: headers,
    };

    const response = await fetch(`${requestUrl}&startAt=${startAt}`, options);
    const data = await response.json();

    await this.checkAnswer(response);
    try {
      const ArrayKeys = [];

      for (const row of data.issues) {
        ArrayKeys.push(row.key);
      }
      for (let index = 1; index < data.total / maxResults; index++) {
        const response = await fetch(
          `${requestUrl}&startAt=${index * maxResults}`,
          options
        );
        const data = await response.json();
        for (const row of data.issues) {
          ArrayKeys.push(row.key);
        }
      }

      return ArrayKeys;
    } catch (error) {
      throw ApiError.BadRequest('Something went wrong when try to establish connection', error);
    }
  }

  async getCommentsByIdIssue(id) {

    if (this.needReloadService) {
      throw this.lastError
    }

    const requestUrl = `
    ${this.URL}/rest/api/2/issue/${id}/comment`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.authToken}`,
    };

    const options = {
      method: 'GET',
      headers: headers,
    };

    const response = await fetch(requestUrl, options);

    await this.checkAnswer(response);
    try {
      const data = await response.json();
      return await data;
    } catch (error) {
      throw ApiError.BadRequest('Something went wrong when try to establish connection', error);
    }
  }

  async getWorklogByIdIssue(id) {

    if (this.needReloadService) {
      throw this.lastError
    }

    const requestUrl = `${this.URL}/rest/api/2/issue/${id}/worklog`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.authToken}`,
    };

    const options = {
      method: 'GET',
      headers: headers,
    };

    const response = await fetch(requestUrl, options);

    await this.checkAnswer(response);
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      throw ApiError.BadRequest('Something went wrong when try to establish connection', error);
    }
  }

  async getProjectStatuses(id) {

    if (this.needReloadService) {
      throw this.lastError
    }

    const requestUrl = `${this.URL}/rest/api/2/project/${id}/statuses`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.authToken}`,
    };

    const options = {
      method: 'GET',
      headers: headers,
    };

    const response = await fetch(requestUrl, options);

    await this.checkAnswer(response);
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      throw ApiError.BadRequest('Something went wrong when try to establish connection', error);
    }
  }

  async getProjectList(startAt = 0) {

    if (this.needReloadService) {
      throw this.lastError
    }

    const requestUrl = `${this.URL}/rest/agile/1.0/board?startAt=${startAt}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.authToken}`,
    };

    const options = {
      method: 'GET',
      headers: headers,
    };

    const response = await fetch(requestUrl, options);

    await this.checkAnswer(response);
    try {
      const data = await response.json();
      let values = data.values

      if (!data.isLast) {
        const startAtNext = startAt + 50;
        const newData = await this.getProjectList(startAtNext);
        if (newData.length > 0) {
          values = await values.concat(newData)
        }
      }

      return values;
    } catch (error) {
      throw ApiError.BadRequest('Something went wrong when try to establish connection', error);
    }
  }

  async testConnection() {

    if (this.needReloadService) {
      throw this.lastError
    }

    const requestUrl = `${this.URL}/rest/api/2/serverInfo`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.authToken}`,
    };

    const options = {
      method: 'GET',
      headers: headers,
    };

    const response = await fetch(requestUrl, options);
    const data = await response.json();
    await this.checkAnswer(response, data);

    try {
      return data;
    } catch (error) {
      throw ApiError.BadRequest('!Something went wrong when try to establish connection', error);
    }
  }
  checkAnswer = (response, body) => {
    if (response.status === 500) {
      throw ApiError.BadRequest(`500 - External ${this.name} is not enable`, body);
    }

    if (response.status === 401) {
      this.needReloadService = true;
      this.lastError = ApiError.BadRequest(`401 - Unauthorized error on ${this.name}`, body);
      throw this.lastError;
    }

    if (response.status === 404) {
      throw ApiError.BadRequest(`404 - ${this.name} not found data`, body);
    }

    if (response.status === 403) {
      this.needReloadService = true;
      this.lastError = ApiError.BadRequest(`403 - Forbidden connection to ${this.name}`, body);
      throw this.lastError;
    }
    return
  }
}

export default jiraConnections;
