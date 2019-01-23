'use strict';

exports.up = (knex) => {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('auth_server_id');
    })
    .createTable('tasks', (table) => {
      table.increments('id').primary();
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.string('name');
      table.integer('duration').unsigned();
      table.string('duration_unit');
      table.date('start_date');
      table.boolean('repeating');
      table.string('notification_option');
      table.index('user_id');
    })
    .createTable('tags', (table) => {
      table.increments('id').primary();
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.string('name');
      table.index('user_id');
    })
    .createTable('tasks_tags', (table) => {
      table
        .integer('task_id')
        .unsigned()
        .references('id')
        .inTable('tasks')
        .onDelete('CASCADE');
      table
        .integer('tag_id')
        .unsigned()
        .references('id')
        .inTable('tags')
        .onDelete('CASCADE');
      table.primary(['task_id', 'tag_id']);
      table.index('tag_id');
    });
};

exports.down = (knex) => {
  return knex.schema
    .dropTableIfExists('tasks_tags')
    .dropTableIfExists('tags')
    .dropTableIfExists('tasks')
    .dropTableIfExists('users');
};
