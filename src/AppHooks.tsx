import React, { useEffect, useState } from 'react';
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

interface Task {
  title: string;
  id: string;
}

const App = () => {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    getTasks();

    const createObservable: Observable<object> = API.graphql(
      graphqlOperation(onCreateTask)
    ) as Observable<object>;

    const createTaskListener = createObservable.subscribe({
      next: (taskData: any) => {
        const newTask = taskData.value.data.onCreateTask;

        setTasks((prevTasks: Task[]) => {
          const oldTasks = prevTasks.filter(
            (task: Task) => task.id !== newTask.id
          );

          return [...oldTasks, newTask];
        });

        setTitle('');
      }
    });

    const deleteObservable: Observable<object> = API.graphql(
      graphqlOperation(onDeleteTask)
    ) as Observable<object>;

    const deleteTaskListener = deleteObservable.subscribe({
      next: (taskData: any) => {
        const deletedTask = taskData.value.data.onDeleteTask;

        setTasks((prevTasks:Task[]) => {
          return prevTasks.filter(
            (task: Task) => task.id != deletedTask.id
          );
        });
      }
    });

    const updateObservable: Observable<object> = API.graphql(
      graphqlOperation(onUpdateTask)
    ) as Observable<object>;

    const updateTaskListener = updateObservable.subscribe({
      next: (taskData: any) => {
        const updatedTask = taskData.value.data.onUpdateTask;

        setTasks(prevTasks => {
          const index = prevTasks.findIndex(
            (task: Task) => task.id === updatedTask.id
          );

          const updatedTasks = [
            ...prevTasks.slice(0, index),
            updatedTask,
            ...prevTasks.slice(index + 1)
          ];

          return updatedTasks;
        });
        setId('');
        setTitle('');
      }
    });

    return () => {
      createTaskListener.unsubscribe();
      deleteTaskListener.unsubscribe();
      updateTaskListener.unsubscribe();
    };
  }, []);

  const handleChangeNote = (event: React.ChangeEvent<HTMLInputElement>) =>
    setTitle(event.target.value);

  const getTasks = async () => {
    const result = (await API.graphql(graphqlOperation(listTasks))) as any;

    setTasks(result.data.listTasks.items);
  };

  const handleAddNote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (hasExistingTask()) {
      handleUpdateTask(title, id);
    } else {
      addNewTask(title);
    }
  };

  const hasExistingTask = () => {
    if (id) {
      return tasks.findIndex((task: Task) => task.id === id) > -1;
    }

    return false;
  };

  const handleUpdateTask = (title: any, id: any) => {
    const input = {
      id,
      title
    };

    API.graphql(
      graphqlOperation(updateTask, {
        input
      })
    );
  };

  const addNewTask = (title: any) => {
    const input = {
      title
    };

    API.graphql(
      graphqlOperation(createTask, {
        input
      })
    );
  };

  const handleDeleteTask = async (taskId: any) => {
    const input = { id: taskId };
    await API.graphql(graphqlOperation(deleteTask, { input }));
  };

  const handEditTask = ({ title, id }: any) => {
    setId(id);
    setTitle(title);
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h2 className="code f2-l">ErrTracker App</h2>
      <form onSubmit={handleAddNote} className="mb3">
        <input
          type="text"
          className="pa2 f4"
          placeholder="new site title"
          onChange={handleChangeNote}
          value={title}
        />
        <button type="submit" className="pa2 f4">{id ? 'update Task' : 'Add Task'}</button>
      </form>
      Tasks list:
      <div>
        {tasks.map((task: Task) => (
          <li className="list pa1 f3" key={task.id}>
            {task.title}
            <button
              className="pa2 f4"
              onClick={() => handEditTask(task)}
            >
              edit
            </button>
            <button
              className="pa2 f4"
              onClick={() => handleDeleteTask(task.id)}
            >
              &times;
            </button>
          </li>
        ))}
      </div>
    </div>
  );
};

export default withAuthenticator(App, {
  includeGreetings: true
});
