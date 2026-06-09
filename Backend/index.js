import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pkg from 'pg';
import bcrypt, { hash } from 'bcrypt';

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Here’s the flow in simple terms:

// Middleware runs first (your authenticateToken function).
// If the token is valid:
// It adds the user info to req.user.
// Then calls next().
// Calling next() tells Express, "Okay, authentication is done, proceed to the next handler".
// The next handler is often your route handler, e.g., app.post('/some-route', ...).
// Inside that route handler, you can access the authenticated user's data from req.user.


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'task-manager',
  password: process.env.DB_PASSWORD,
  port: 5432,
});

app.post('/users', async (req, res) => {
  const { username, email, phone_number, password, age, type } = req.body;

  try {
    const existingUser = await pool.query(
      `SELECT * FROM users WHERE username = $1 OR email = $2 OR phone_number = $3`,
      [username, email, phone_number]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username, email or phone number already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password, age, phone_number, type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [username, email, hashedPassword, age, phone_number, type]
    );

    res.status(201).json(result.rows[0]);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try
  {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0)
    {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid)
    {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, type: user.type},
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  }
  catch (error)
  {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/users', async (req, res) => {
  const { username } = req.query;

  if (!username)
  {
    return res.status(400).json({ message: 'Username query param is required' });
  }

  try
  {
    const result = await pool.query(
      'SELECT username, email, age, phone_number FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0)
    {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  }
  catch (error)
  {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/resources', async (req, res) => {
  try
  {
    const result = await pool.query('SELECT "resource-id", name, designation FROM resources WHERE "proj-id" IS NULL');
    res.json(result.rows);
  }
  catch (error)
  {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error fetching resources' });
  }
});

app.post('/projects', authenticateToken, async (req, res) => {
  const {
    project_name,
    description,
  } = req.body;

  const user_id = req.user.id;

  try {
    if ( !project_name || !description )
    {
      return res.status(400).json({ message: 'Missing or invalid project data' });
    }

    await pool.query(`INSERT INTO project (name, "user-id", description, active_sprint) VALUES ($1, $2, $3, $4)`, [project_name, user_id, description, null]);

    res.status(201).json({ message: 'Project created successfully' });
  }
  catch (error)
  {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

app.delete('/projects', authenticateToken, async (req, res) => {
  const { project_id } = req.body;
  const userId = req.user.id;

  try
  {
    if (!project_id)
    {
      return res.status(400).json({ message: 'Missing or invalid project id' });
    }

    const result = await pool.query(`SELECT * FROM project WHERE "project-id" = $1 AND "user-id" = $2`, [project_id, userId]);

    if (result.rows.length === 0)
    {
      return res.status(403).json({ message: 'Unauthorized or project not found' });
    }
    await pool.query(`DELETE FROM project WHERE "project-id" = $1`, [project_id]);

    res.status(200).json({ message: 'Project deleted successfully' });
  }
  catch (error)
  {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

app.get('/projects', authenticateToken, async (req, res) => {
  const id = req.user.id;
  const type = req.user.type;

  if (!id)
  {
    return res.status(400).json({ message: 'ID query param is required' });
  }

  if (!type)
  {
    return res.status(400).json({ message: 'TYPE query param is required' });
  }

  try {
    let result;

    if (type === 'PM')
    {
      result = await pool.query(`
        SELECT p."project-id", p.name AS project_name, p.description, p.active_sprint, p.status
        FROM project p 
        WHERE p."user-id" = $1
        AND p.status != 'Completed'
      `, [id]);
    }
    else if (type === 'TL')
    {
      result = await pool.query(`
        SELECT p."project-id", p.name AS project_name, p.description, p.active_sprint, p.status
        FROM project p 
        JOIN sprint ON p."project-id" = sprint.project_id 
        WHERE sprint.team_lead = $1
        AND p.status != 'Completed'
      `, [id]);
    }
    else if (type === 'DEV')
    {
      result = await pool.query(`
        SELECT p."project-id", p.name AS project_name, p.description, p.active_sprint, p.status 
        FROM project p 
        JOIN sprint ON p."project-id" = sprint.project_id 
        JOIN sprint_tasks ON sprint.sprint_id = sprint_tasks.sprint_id
        WHERE sprint_tasks.developer = $1
        AND p.status != 'Completed'
      `, [id]);
    }
    else if (type === 'AD')
    {
      result = await pool.query(`SELECT * FROM project p WHERE p.status != 'Completed'`);
    }

    res.status(200).json(result.rows);
  }
  catch (error)
  {
    console.error('Error fetching project data:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch project data', error: error.message });
  }
});

app.post('/backlog', authenticateToken, async (req, res) => {
  const {
    name,
    description
  } = req.body;

  try {
    if ( !name || !description ) 
    {
      return res.status(400).json({ message: 'Missing or invalid backlog data' });
    }

    await pool.query(
      `INSERT INTO backlog (name, description) VALUES ($1, $2)`,
      [name, description]
    );

    res.status(201).json({ message: 'Backlog added successfully' });
  } 
  catch (error) 
  {
    console.error('Error adding backlog:', error);
    res.status(500).json({ message: 'Server error adding backlog' });
  }
});

app.get('/backlog', authenticateToken, async (req, res) => {
  try
  {
    const result = await pool.query(`SELECT * from backlog`);

    if (result.rows.length === 0)
    {
      return res.status(200).json([]);
    }

    res.json(result.rows);
  }
  catch (error)
  {
    console.error('Error fetching backlog data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/backlog', authenticateToken, async (req, res) => {
  const { task_id } = req.body;

  try
  {
    if (!task_id)
    {
      return res.status(400).json({ message: 'Missing or invalid task id' });
    }

    await pool.query(`DELETE FROM backlog WHERE task_id = $1`, [task_id]);

    res.status(200).json({ message: 'Backlog deleted successfully' });
  }
  catch (error)
  {
    console.error('Error deleting backlog:', error);
    res.status(500).json({ message: 'Server error deleting backlog' });
  }
});

app.post('/sprints', authenticateToken, async (req, res) => {
  const {
    start_date,
    completion_date,
    project_id,
    team_lead,
    name,
    description
  } = req.body;

  const user_id = req.user.id;

  try
  {
    if ( !name || !start_date || !completion_date || !project_id || !team_lead )
    {
      return res.status(400).json({ message: 'Missing or invalid project data' });
    }

    const result = await pool.query(
      `INSERT INTO sprint (
        start_date, completion_date, project_id, 
        team_lead, name, description
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING sprint_id`,
      [start_date, completion_date, project_id, team_lead, name, description]
    );

    const sprintId = result.rows[0].sprint_id;

    await pool.query(`UPDATE project SET active_sprint = $1 WHERE "project-id" = $2`, [sprintId, project_id]);

    res.status(201).json({ message: 'Sprint created successfully' });
  }
  catch (error)
  {
    console.error('Error adding sprint:', error);
    res.status(500).json({ message: 'Server error adding sprint' });
  }
});

app.get('/teamlead', async (req, res) => {
  try
  {
    const result = await pool.query(`SELECT id, username FROM users WHERE type = $1`, ["TL"]);
    res.json(result.rows);
  }
  catch (error)
  {
    console.error('Error fetching team leads:', error);
    res.status(500).json({ message: 'Server error fetching team leads' });
  }
});

app.get('/developers', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, username FROM users WHERE type = $1`, ["DEV"]);
    res.json(result.rows);
  }
  catch (error)
  {
    console.error('Error fetching developers:', error);
    res.status(500).json({ message: 'Server error fetching developers' });
  }
});

app.get('/sprints', authenticateToken, async (req, res) => {
  const id = req.user.id;
  const type = req.user.type;

  if (!id)
  {
    return res.status(400).json({ message: 'ID query param is required' });
  }

  if (!type)
  {
    return res.status(400).json({ message: 'TYPE query param is required' });
  }

  try {
    let result;

    if (type === 'PM')
    {
      result = await pool.query(`SELECT * from sprint WHERE sprint.status != 'Completed'`);
    }
    else if (type === 'TL')
    {
      result = await pool.query(`
        SELECT * from sprint WHERE sprint.team_lead = $1 AND sprint.status != 'Completed'
      `, [id]);
    }
    else if (type === 'DEV')
    {
      result = await pool.query(`
        SELECT * FROM sprint
        JOIN sprint_tasks ON sprint.sprint_id = sprint_tasks.sprint_id
        WHERE sprint_tasks.developer = $1 AND sprint_tasks.status != 'Completed'
      `, [id]);
    }
    else if (type === 'AD')
    {
      result = await pool.query(`SELECT * FROM sprint JOIN sprint_tasks ON sprint.sprint_id = sprint_tasks.sprint_id WHERE sprint_tasks.status != 'Completed'`);
    }

    res.status(200).json(result.rows);
  }
  catch (error)
  {
    console.error('Error fetching sprint data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/sprints', authenticateToken, async (req, res) => {
  const { sprint_id } = req.body;

  try
  {
    if (!sprint_id)
    {
      return res.status(400).json({ message: 'Missing or invalid sprint id' });
    }

    await pool.query(`UPDATE project SET active_sprint = NULL WHERE active_sprint = $1`, [sprint_id]);
    await pool.query(`DELETE FROM sprint_tasks WHERE sprint_id = $1`, [sprint_id]);
    await pool.query(`DELETE FROM sprint WHERE sprint_id = $1`, [sprint_id]);

    res.status(200).json({ message: 'Sprint deleted successfully' });
  }
  catch (error)
  {
    console.error('Error deleting sprint:', error);
    res.status(500).json({ message: 'Server error deleting sprint' });
  }
});

app.post('/task', authenticateToken, async (req, res) => {
  const {
    task_id,
    name,
    description,
    developers,
    sprint_id
  } = req.body;

  const user_id = req.user.id;

  try
  {
    if ( !task_id || !name || !developers || !sprint_id)
    {
      return res.status(400).json({ message: 'Missing or invalid task data' });
    }

    for (const dev of developers)
    {
      await pool.query(
        `INSERT INTO sprint_tasks (name, description, developer, sprint_id) VALUES ($1, $2, $3, $4)`,
        [name, description, dev, sprint_id]
      );
    }

    await pool.query(`DELETE FROM backlog WHERE task_id = $1`, [task_id]);

    res.status(201).json({ message: 'Task moved from backlog to sprint successfully' });
  }
  catch (error)
  {
    console.error('Error moving task:', error);
    res.status(500).json({ message: 'Server error moving task' });
  }
});

app.get('/sprint-tasks/:sprint_id', authenticateToken, async (req, res) => {
  const { sprint_id } = req.params;
  try
  {
    const result = await pool.query(
      `SELECT * FROM sprint_tasks WHERE sprint_id = $1 AND sprint_tasks.status != 'Completed'`,
      [sprint_id]
    );
    res.json(result.rows);
  }
  catch (error)
  {
    console.error('Error fetching sprint tasks:', error);
    res.status(500).json({ message: 'Server error fetching sprint tasks' });
  }
});

app.patch('/sprints/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE sprint SET status = $1 WHERE sprint_id = $2', [status, id]);

    if (status === 'Completed')
    {
      await pool.query('UPDATE sprint_tasks SET status = $1 WHERE sprint_id = $2', ['Completed', id]);
      await pool.query('UPDATE project SET active_sprint = $1 WHERE active_sprint = $2', [null, id]);
    }

    res.status(200).json({ message: 'Sprint status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating sprint status' });
  }
});

app.patch('/sprint-tasks/:sprint_id/:task_name/status', authenticateToken, async (req, res) => {
  const { sprint_id, task_name } = req.params;
  const { status } = req.body;
  try {
    await pool.query(
      'UPDATE sprint_tasks SET status = $1 WHERE sprint_id = $2 AND name = $3',
      [status, sprint_id, task_name]
    );
    res.status(200).json({ message: 'Task status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task status' });
  }
});

app.patch('/projects/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try
  {
    await pool.query('UPDATE project SET status = $1 WHERE "project-id" = $2', [status, id]);

    if (status === 'Completed')
    {
      await pool.query('UPDATE sprint SET status = $1 WHERE project_id = $2', ['Completed', id]);

      await pool.query(
        `UPDATE sprint_tasks 
         SET status = $1 
         WHERE sprint_id IN (
           SELECT sprint_id FROM sprint WHERE project_id = $2
         )`,
        ['Completed', id]
      );

      await pool.query('UPDATE project SET active_sprint = $1 WHERE "project-id" = $2', [null, id]);
    }

    res.status(200).json({ message: 'Project status updated' });
  }
  catch (error)
  {
    console.error('Error updating project status:', error);
    res.status(500).json({ message: 'Error updating project status' });
  }
});

app.get('/history/projects', authenticateToken, async (req, res) => {
  const id = req.user.id;
  const type = req.user.type;
  try {
    let result;
    if (type === 'PM') {
      result = await pool.query('SELECT * FROM project WHERE "user-id" = $1 AND status = $2', [id, 'Completed']);
    } else if (type === 'TL') {
      result = await pool.query(`
        SELECT p.* FROM project p
        JOIN sprint s ON p."project-id" = s.project_id
        WHERE s.team_lead = $1 AND p.status = $2
      `, [id, 'Completed']);
    } else if (type === 'DEV') {
      result = await pool.query(`
        SELECT p.* FROM project p
        JOIN sprint s ON p."project-id" = s.project_id
        JOIN sprint_tasks st ON s.sprint_id = st.sprint_id
        WHERE st.developer = $1 AND p.status = $2
      `, [id, 'Completed']);
    } else if (type === 'AD') {
      result = await pool.query(`SELECT * FROM project WHERE status = $1`, ['Completed']);
    }
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching completed projects' });
  }
});

app.get('/history/sprints', authenticateToken, async (req, res) => {
  const id = req.user.id;
  const type = req.user.type;
  try {
    let result;
    if (type === 'PM') {
      result = await pool.query('SELECT * FROM sprint WHERE status = $1', ['Completed']);
    } else if (type === 'TL') {
      result = await pool.query('SELECT * FROM sprint WHERE team_lead = $1 AND status = $2', [id, 'Completed']);
    } else if (type === 'DEV') {
      result = await pool.query(`
        SELECT s.* FROM sprint s
        JOIN sprint_tasks st ON s.sprint_id = st.sprint_id
        WHERE st.developer = $1 AND s.status = $2
      `, [id, 'Completed']);
    } else if (type === 'AD') {
      result = await pool.query('SELECT * FROM sprint WHERE status = $1', ['Completed']);
    }
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching completed sprints' });
  }
});

app.get('/history/tasks', authenticateToken, async (req, res) => {
  const id = req.user.id;
  const type = req.user.type;
  try {
    let result;
    if (type === 'PM') {
      result = await pool.query('SELECT * FROM sprint_tasks WHERE status = $1', ['Completed']);
    } else if (type === 'TL') {
      result = await pool.query(`
        SELECT st.* FROM sprint_tasks st
        JOIN sprint s ON st.sprint_id = s.sprint_id
        WHERE s.team_lead = $1 AND st.status = $2
      `, [id, 'Completed']);
    } else if (type === 'DEV') {
      result = await pool.query('SELECT * FROM sprint_tasks WHERE developer = $1 AND status = $2', [id, 'Completed']);
    } else if (type === 'AD') {
      result = await pool.query('SELECT * FROM sprint_tasks WHERE status = $1', ['Completed']);
    }
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching completed tasks' });
  }
});

app.get('/all-projects', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT "project-id", name FROM project');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all projects' });
  }
});


app.get('/all-sprints', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT sprint_id, name FROM sprint');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all sprints' });
  }
});


app.post('/pending-edit', authenticateToken, async (req, res) => {
  const { type, entity_id, new_data } = req.body;
  const user_id = req.user.id;

  try 
  {
    if (!type || !entity_id || !new_data) 
    {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO pending_edits (type, entity_id, new_data, requested_by, status) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [type, entity_id, JSON.stringify(new_data), user_id, 'pending']
    );

    let pm_id = null;
    if (type === 'sprint')
    {
      const sprint = await pool.query('SELECT project_id FROM sprint WHERE sprint_id = $1', [entity_id]);
      if (sprint.rows.length > 0)
      {
        const project = await pool.query('SELECT "user-id" FROM project WHERE "project-id" = $1', [sprint.rows[0].project_id]);
        if (project.rows.length > 0) pm_id = project.rows[0]["user-id"];
      }
    }
    else if (type === 'task')
    {
      const task = await pool.query('SELECT sprint_id FROM sprint_tasks WHERE id = $1', [entity_id]);
      if (task.rows.length > 0)
      {
        const sprint = await pool.query('SELECT project_id FROM sprint WHERE sprint_id = $1', [task.rows[0].sprint_id]);
        if (sprint.rows.length > 0)
        {
          const project = await pool.query('SELECT "user-id" FROM project WHERE "project-id" = $1', [sprint.rows[0].project_id]);
          if (project.rows.length > 0) pm_id = project.rows[0]["user-id"];
        }
      }
    }
    if (pm_id)
    {
      if(type === 'task')
      {
        const task_name = await pool.query('SELECT name FROM sprint_tasks WHERE id = $1', [entity_id]);
        await pool.query(
        `INSERT INTO notifications (user_id, message, status, related_edit_id) VALUES ($1, $2, $3, $4)`,
        [pm_id, `Edit request for ${type} "${task_name.rows[0].name}" pending your approval.`, 'unread', result.rows[0].id]
      );
      }
      else if(type === 'sprint')
      {
        const sprint_name = await pool.query('SELECT name FROM sprint WHERE sprint_id = $1', [entity_id]);
        await pool.query(
        `INSERT INTO notifications (user_id, message, status, related_edit_id) VALUES ($1, $2, $3, $4)`,
        [pm_id, `Edit request for ${type} "${sprint_name.rows[0].name}" pending your approval.`, 'unread', result.rows[0].id]
      );
      }
    }
    res.status(201).json({ message: 'Edit request submitted and PM notified.' });
  }
  catch (err)
  {
    console.error('Error creating pending edit:', err);
    res.status(500).json({ message: 'Server error creating pending edit' });
  }
});

app.post('/pending-edit/:id/decision', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body;
  const pm_id = req.user.id;

  try
  {
    const editRes = await pool.query('SELECT * FROM pending_edits WHERE id = $1', [id]);

    if (editRes.rows.length === 0) return res.status(404).json({ message: 'Pending edit not found' });
    const edit = editRes.rows[0];
    let project_pm_id = null;

    if (edit.type === 'sprint')
    {
      const sprint = await pool.query('SELECT project_id FROM sprint WHERE sprint_id = $1', [edit.entity_id]);
      if (sprint.rows.length > 0)
      {
        const project = await pool.query('SELECT "user-id" FROM project WHERE "project-id" = $1', [sprint.rows[0].project_id]);
        if (project.rows.length > 0) project_pm_id = project.rows[0]["user-id"];
      }
    }
    else if (edit.type === 'task')
    {
      const task = await pool.query('SELECT sprint_id FROM sprint_tasks WHERE id = $1', [edit.entity_id]);
      if (task.rows.length > 0)
      {
        const sprint = await pool.query('SELECT project_id FROM sprint WHERE sprint_id = $1', [task.rows[0].sprint_id]);
        if (sprint.rows.length > 0)
        {
          const project = await pool.query('SELECT "user-id" FROM project WHERE "project-id" = $1', [sprint.rows[0].project_id]);
          if (project.rows.length > 0) project_pm_id = project.rows[0]["user-id"];
        }
      }
    }

    if (pm_id !== project_pm_id) return res.status(403).json({ message: 'Not authorized' });
    
    await pool.query('UPDATE pending_edits SET status = $1, decided_by = $2 WHERE id = $3', [decision, pm_id, id]);
    if (decision === 'approved')
    {
      let newData = edit.new_data;
      if (typeof newData === 'string')
      {
        try
        {
          newData = JSON.parse(newData);
        }
        catch (e)
        {
          return res.status(400).json({ message: 'Invalid new_data JSON' });
        }
      }
      if (edit.type === 'sprint')
      {
        const data = newData;
        await pool.query('UPDATE sprint SET name = $1, description = $2, start_date = $3, completion_date = $4, team_lead = $5 WHERE sprint_id = $6',
          [data.name, data.description, data.start_date, data.completion_date, data.team_lead, edit.entity_id]);
      }
      else if (edit.type === 'task')
      {
        const data = newData;
        await pool.query('UPDATE sprint_tasks SET name = $1, description = $2, developer = $3 WHERE id = $4',
          [data.name, data.description, data.developer, edit.entity_id]);
      }
    }

    let entityName = '';
    if (edit.new_data)
    {
      let parsed = edit.new_data;
      if (typeof parsed === 'string')
      {
        try
        {
          parsed = JSON.parse(parsed);
        }
        catch {}
      }
      if (parsed && (parsed.name || parsed.task_name))
      {
        entityName = parsed.name || parsed.task_name;
      }
    }

    if (!entityName)
    {
      if (edit.type === 'task')
      {
        const taskRes = await pool.query('SELECT name FROM sprint_tasks WHERE id = $1', [edit.entity_id]);
        if (taskRes.rows.length > 0) entityName = taskRes.rows[0].name;
      }
      else if (edit.type === 'sprint')
      {
        const sprintRes = await pool.query('SELECT name FROM sprint WHERE sprint_id = $1', [edit.entity_id]);
        if (sprintRes.rows.length > 0) entityName = sprintRes.rows[0].name;
      }
    }

    await pool.query(
      `INSERT INTO notifications (user_id, message, status, related_edit_id) VALUES ($1, $2, $3, $4)`,
      [edit.requested_by, `Your edit for ${edit.type} "${entityName || edit.entity_id}" was ${decision}.`, 'unread', id]
    );
    res.json({ message: `Edit ${decision}` });
  }
  catch (err)
  {
    console.error('Error approving/rejecting edit:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/my-pending-edits', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  try
  {
    const result = await pool.query('SELECT * FROM pending_edits WHERE requested_by = $1 AND status = $2', [user_id, 'pending']);
    res.json(result.rows);
  }
  catch (err)
  {
    res.status(500).json({ message: 'Error fetching pending edits' });
  }
});

app.get('/pending-approvals', authenticateToken, async (req, res) => {
  const pm_id = req.user.id;

  try {
    const projects = await pool.query('SELECT "project-id" FROM project WHERE "user-id" = $1', [pm_id]);
    const projectIds = projects.rows.map(r => r["project-id"]);

    if (projectIds.length === 0) return res.json([]);
    const sprints = await pool.query('SELECT sprint_id FROM sprint WHERE project_id = ANY($1)', [projectIds]);
    const sprintIds = sprints.rows.map(r => r.sprint_id);

    let edits = [];
    if (sprintIds.length > 0) {
      const sprintEdits = await pool.query(`
        SELECT pe.*, u.username AS requested_by_name
        FROM pending_edits pe
        LEFT JOIN users u ON pe.requested_by = u.id
        WHERE pe.type = $1 AND pe.entity_id = ANY($2) AND pe.status = $3
      `, ['sprint', sprintIds, 'pending']);
      edits = edits.concat(sprintEdits.rows);

      const taskIdsRes = await pool.query('SELECT id FROM sprint_tasks WHERE sprint_id = ANY($1)', [sprintIds]);
      const taskIds = taskIdsRes.rows.map(r => r.id);

      if (taskIds.length > 0) {
        const taskEdits = await pool.query(`
          SELECT pe.*, u.username AS requested_by_name
          FROM pending_edits pe
          LEFT JOIN users u ON pe.requested_by = u.id
          WHERE pe.type = $1 AND pe.entity_id = ANY($2) AND pe.status = $3
        `, ['task', taskIds, 'pending']);
        edits = edits.concat(taskEdits.rows);
      }
    }
    res.json(edits);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending approvals' });
  }
});

app.get('/notifications', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  try
  {
    const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [user_id]);
    res.json(result.rows);
  }
  catch (err)
  {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

app.patch('/notifications/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try
  {
    await pool.query('UPDATE notifications SET status = $1 WHERE id = $2 AND user_id = $3', ['read', id, user_id]);
    res.json({ message: 'Notification marked as read' });
  }
  catch (err)
  {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});