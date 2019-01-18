'use strict';

exports.up = (knex) => {
  knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email');
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
  knex.schema
    .dropTableIfExists('users')
    .dropTableIfExists('tasks')
    .dropTableIfExists('tags')
    .dropTableIfExists('tasks_tags');
};
