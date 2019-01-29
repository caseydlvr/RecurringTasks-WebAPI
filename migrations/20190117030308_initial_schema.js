'use strict';

exports.up = (knex) => {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('auth_server_id');
    })
    .createTable('tasks', (table) => {
      table.specificType('id', 'serial');
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.string('name').notNullable();
      table.integer('duration').unsigned().notNullable();
      table.string('duration_unit').notNullable();
      table.date('start_date').notNullable().defaultTo(knex.fn.now());
      table.boolean('repeating').notNullable();
      table.string('notification_option').notNullable();
      table.primary(['id', 'user_id']);
      table.index('user_id');
    })
    .createTable('tags', (table) => {
      table.specificType('id', 'serial');
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.string('name').notNullable();
      table.primary(['id', 'user_id']);
      table.index('user_id');
    })
    .createTable('tasks_tags', (table) => {
      table
        .integer('task_id')
        .unsigned()
        .notNullable();
      table
        .integer('tag_id')
        .unsigned()
        .notNullable();
      table
        .integer('user_id')
        .unsigned()
        .notNullable();
      table
        .foreign(['task_id', 'user_id'])
        .references(['id', 'user_id'])
        .inTable('tasks')
        .onDelete('CASCADE');
      table
        .foreign(['tag_id', 'user_id'])
        .references(['id', 'user_id'])
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
