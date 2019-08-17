'use strict';

exports.up = (knex) => {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('auth_server_id').unique().notNullable();
    })
    .createTable('tasks', (table) => {
      table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid()'));
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
      table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid()'));
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
      table.uuid('task_id').notNullable();
      table.uuid('tag_id').notNullable();
      table.integer('user_id').unsigned().notNullable();
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
