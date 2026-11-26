/** Built-in Task filter attributes mapped to their value types. */
export type TaskAttributes = {
  "task.id": "text";
  "task.taskDefinitionKey": "text";
  "task.businessKey": "text";
  "task.name": "text";
  "task.description": "text";
  "task.formKey": "text";
  "task.assignee": "text";
  "task.owner": "text";
  "task.priority": "integer";
  "task.createTime": "timestamp";
  "task.dueDate": "timestamp";
  "task.followUpDate": "timestamp";
  "task.deleted": "boolean";
  "task.processName": "text";
  "task.textSearch": "text";
};

/** Built-in Data Entry filter attributes mapped to their value types. */
export type DataAttributes = {
  "data.entryType": "text";
  "data.entryId": "text";
  "data.type": "text";
  "data.applicationName": "text";
  "data.name": "text";
  "data.description": "text";
  "data.formKey": "text";
  "data.identity": "text";
  "data.state.state": "text";
  "data.state.processingType": "processing";
  "data.deleted": "boolean";
};
