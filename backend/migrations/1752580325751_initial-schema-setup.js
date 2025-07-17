// backend/migrations/your-timestamp_initial-schema-setup.js

exports.shorthands = undefined;

exports.up = pgm => {
    console.log("---- RUNNING INITIAL SCHEMA SETUP MIGRATION ----");

    // 1. Create ENUM types for roles and statuses
    pgm.createType('role_type', ['Employee', 'Intern', 'HR', 'Admin']);
    
    // 2. Create SHIFT_MASTER table
    pgm.createTable('shift_master', {
        id: 'id', // This creates a SERIAL PRIMARY KEY
        shift_name: { type: 'varchar(100)', notNull: true, unique: true },
        start_time: { type: 'time', notNull: true },
        end_time: { type: 'time', notNull: true },
        duration_hours: { type: 'decimal(4, 2)', notNull: true },
        paid_break_minutes: { type: 'integer', notNull: true },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    
    // 3. Create EMPLOYEE_MASTER table
    pgm.createTable('employee_master', {
        id: 'id',
        employee_code: { type: 'varchar(50)', notNull: true, unique: true },
        full_name: { type: 'varchar(255)', notNull: true },
        email: { type: 'varchar(255)', notNull: true, unique: true },
        password_hash: { type: 'varchar(255)', notNull: true },
        role: { type: 'role_type', notNull: true },
        designation: { type: 'varchar(100)' },
        department: { type: 'varchar(100)' },
        manager_id: {
            type: 'integer',
            references: '"employee_master"(id)', // Self-referencing FK
            onDelete: 'SET NULL',
        },
        shift_group_id: {
            type: 'integer',
            // We will add the reference after creating the shift_master table
            // to avoid circular dependency issues if they were in separate files.
        },
        joining_date: { type: 'date', notNull: true },
        is_alt_saturday_eligible: { type: 'boolean', default: false },
        is_active: { type: 'boolean', default: true },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // 4. Now add the foreign key constraint to shift_group_id
    pgm.addConstraint('employee_master', 'fk_shift_group', {
        foreignKeys: {
            columns: 'shift_group_id',
            references: 'shift_master(id)',
            onDelete: 'SET NULL', // Or RESTRICT if a shift is required
        },
    });

    console.log("---- MIGRATION COMPLETED ----");
};

exports.down = pgm => {
    // To reverse the migration, drop tables in reverse order of creation
    pgm.dropTable('employee_master');
    pgm.dropTable('shift_master');
    pgm.dropType('role_type');
};