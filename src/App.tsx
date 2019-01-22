import React, { Component } from 'react';
import './App.css';

import { withAuthenticator } from 'aws-amplify-react';
import { API, graphqlOperation } from 'aws-amplify';

import {
  onCreateTask,
  onDeleteTask,
  onUpdateTask
} from './graphql/subscriptions';
import { createTask, deleteTask, updateTask } from './graphql/mutations';
import { listTasks } from './graphql/queries';
import Observable from 'zen-observable';

class App extends Component {
  state = {
    id: '',
    title: '',
    tasks: [
      {
        id: 1,
        title: 'test'
      }
    ]
  };

  handleChangeNote = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      title: event.target.value
    });
  };
  private createTaskListener: any;
  private deleteTaskListener: any;
  private updateTaskListener: any;

  componentDidMount() {
    this.getTasks();

    const createObservable: Observable<object> = API.graphql(
      graphqlOperation(onCreateTask)
    ) as Observable<object>;

    this.createTaskListener = createObservable.subscribe({
      next: (taskData: any) => {
        const newTask = taskData.value.data.onCreateTask;

        const prevTasks = this.state.tasks.filter(
          (task: any) => task.id !== newTask.id
        );

        const updatedTasks = [...prevTasks, newTask];

        this.setState({ tasks: updatedTasks, title: '' });
      }
    });

    const deleteObservable: Observable<object> = API.graphql(
      graphqlOperation(onDeleteTask)
    ) as Observable<object>;

    this.deleteTaskListener = deleteObservable.subscribe({
      next: (taskData: any) => {
        const deletedTask = taskData.value.data.onDeleteTask;

        const deletedTasks = this.state.tasks.filter(
          task => task.id != deletedTask.id
        );

        this.setState({ tasks: deletedTasks });
      }
    });

    const updateObservable: Observable<object> = API.graphql(
      graphqlOperation(onUpdateTask)
    ) as Observable<object>;

    this.updateTaskListener = updateObservable.subscribe({
      next: (taskData: any) => {
        const { tasks } = this.state;

        const updatedTask = taskData.value.data.onUpdateTask;

        const index = tasks.findIndex(
          (task: any) => task.id === updatedTask.id
        );

        const updatedTasks = [
          ...tasks.slice(0, index),
          updatedTask,
          ...tasks.slice(index + 1)
        ];

        this.setState({ tasks: updatedTasks, title: '', id: '' });
      }
    });
  }

  private async getTasks() {
    const result = (await API.graphql(graphqlOperation(listTasks))) as any;

    this.setState({ tasks: result.data.listTasks.items });
  }

  async componentWillUnmount() {
    this.createTaskListener.unsubscribe();
    this.deleteTaskListener.unsubscribe();
    this.updateTaskListener.unsubscribe();
  }

  handleAddNote = (event: React.FormEvent<HTMLFormElement>) => {
    const { title, id } = this.state;

    event.preventDefault();

    if (this.hasExistingTask()) {
      App.handleUpdateTask(title, id);
    } else {
      App.addNewTask(title);
    }
  };

  private hasExistingTask() {
    const { tasks, id } = this.state;

    if (id) {
      return tasks.findIndex((task: any) => task.id === id) > -1;
    }

    return false;
  }

  private static handleUpdateTask(title: any, id: any) {
    const input = {
      id,
      title
    };

    API.graphql(
      graphqlOperation(updateTask, {
        input
      })
    );
  }

  private static addNewTask(title: any) {
    const input = {
      title
    };

    API.graphql(
      graphqlOperation(createTask, {
        input
      })
    );
  }

  handleDeleteTask = async (taskId: any) => {
    const input = { id: taskId };
    await API.graphql(graphqlOperation(deleteTask, { input }));
  };

  handEditTask = ({ title, id }: any) => {
    this.setState({ id, title });
  };

  render() {
    const { tasks, title, id } = this.state;

    return (
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h2 className="code f2-l">ErrTracker App</h2>
        <form onSubmit={this.handleAddNote} className="mb3">
          <input
            type="text"
            className="pa2 f4"
            placeholder="new site title"
            onChange={this.handleChangeNote}
            value={title}
          />
          <button type="submit">{id ? 'update Task' : 'Add Task'}</button>
        </form>
        Tasks list:
        <div>
          {tasks.map(task => (
            <li className="list pa1 f3" key={task.id}>
              {task.title}
              <button
                className="bg-transparent bn f4"
                onClick={() => this.handEditTask(task)}
              >
                edit
              </button>
              <button
                className="bg-transparent bn f4"
                onClick={() => this.handleDeleteTask(task.id)}
              >
                &times;
              </button>
            </li>
          ))}
        </div>
      </div>
    );
  }
}

export default withAuthenticator(App, {
  includeGreetings: true
});
