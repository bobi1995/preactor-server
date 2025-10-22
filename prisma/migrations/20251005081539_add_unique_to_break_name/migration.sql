BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Resources] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [picture] NVARCHAR(1000),
    [color] NVARCHAR(1000),
    [external_code] NVARCHAR(1000) NOT NULL,
    [accumulative] BIT,
    [regular_shift_id] INT,
    [schedule_id] INT,
    [changeover_group_id] INT,
    CONSTRAINT [Resources_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Resources_external_code_key] UNIQUE NONCLUSTERED ([external_code])
);

-- CreateTable
CREATE TABLE [dbo].[Resource_groups] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Resource_groups_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Resource_groups_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Shifts] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [start_time] NVARCHAR(1000) NOT NULL,
    [end_time] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Shifts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Shifts_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Alternative_shifts] (
    [id] INT NOT NULL IDENTITY(1,1),
    [start_date] DATETIME2 NOT NULL,
    [end_date] DATETIME2 NOT NULL,
    [shift_id] INT NOT NULL,
    [resource_id] INT NOT NULL,
    CONSTRAINT [Alternative_shifts_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Schedules] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [monday] INT NOT NULL,
    [tuesday] INT NOT NULL,
    [wednesday] INT NOT NULL,
    [thursday] INT NOT NULL,
    [friday] INT NOT NULL,
    [saturday] INT NOT NULL,
    [sunday] INT NOT NULL,
    CONSTRAINT [Schedules_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Schedules_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Breaks] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [start_time] NVARCHAR(1000) NOT NULL,
    [end_time] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Breaks_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Breaks_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Orders] (
    [id] INT NOT NULL IDENTITY(1,1),
    [orno] NVARCHAR(1000) NOT NULL,
    [opno] NVARCHAR(1000) NOT NULL,
    [start_time] DATETIME2 NOT NULL,
    [end_time] DATETIME2 NOT NULL,
    [project] NVARCHAR(1000),
    [duration] FLOAT(53),
    [task_index] FLOAT(53),
    [part_no] NVARCHAR(1000),
    [product] NVARCHAR(1000),
    [op_name] NVARCHAR(1000),
    [remaining_quan] FLOAT(53),
    [setup_time] FLOAT(53),
    [resource_id] INT NOT NULL,
    [resource_group_id] INT NOT NULL,
    CONSTRAINT [Orders_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Attributes] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Attributes_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Attributes_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Attributes_parameters] (
    [id] INT NOT NULL IDENTITY(1,1),
    [attribute_value] NVARCHAR(1000) NOT NULL,
    [attribute_note] NVARCHAR(1000),
    [attribute_id] INT NOT NULL,
    CONSTRAINT [Attributes_parameters_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Changeover_groups] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Changeover_groups_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Changeover_groups_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Changeover_data] (
    [id] INT NOT NULL IDENTITY(1,1),
    [setup_time] FLOAT(53) NOT NULL,
    [changeover_group_id] INT NOT NULL,
    [attribute_id] INT NOT NULL,
    [from_attr_param_id] INT NOT NULL,
    [to_attr_param_id] INT NOT NULL,
    CONSTRAINT [Changeover_data_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Changeover_times] (
    [id] INT NOT NULL IDENTITY(1,1),
    [changeover_time] FLOAT(53) NOT NULL,
    [changeover_group_id] INT NOT NULL,
    [attribute_id] INT NOT NULL,
    CONSTRAINT [Changeover_times_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[REL_Resource_group] (
    [resource_id] INT NOT NULL,
    [resource_group_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [REL_Resource_group_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [REL_Resource_group_pkey] PRIMARY KEY CLUSTERED ([resource_id],[resource_group_id])
);

-- CreateTable
CREATE TABLE [dbo].[REL_Break_Shift] (
    [break_id] INT NOT NULL,
    [shift_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [REL_Break_Shift_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [REL_Break_Shift_pkey] PRIMARY KEY CLUSTERED ([break_id],[shift_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Resources] ADD CONSTRAINT [Resources_regular_shift_id_fkey] FOREIGN KEY ([regular_shift_id]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Resources] ADD CONSTRAINT [Resources_schedule_id_fkey] FOREIGN KEY ([schedule_id]) REFERENCES [dbo].[Schedules]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Resources] ADD CONSTRAINT [Resources_changeover_group_id_fkey] FOREIGN KEY ([changeover_group_id]) REFERENCES [dbo].[Changeover_groups]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Alternative_shifts] ADD CONSTRAINT [Alternative_shifts_shift_id_fkey] FOREIGN KEY ([shift_id]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Alternative_shifts] ADD CONSTRAINT [Alternative_shifts_resource_id_fkey] FOREIGN KEY ([resource_id]) REFERENCES [dbo].[Resources]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Schedules] ADD CONSTRAINT [Schedules_monday_fkey] FOREIGN KEY ([monday]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Schedules] ADD CONSTRAINT [Schedules_tuesday_fkey] FOREIGN KEY ([tuesday]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Schedules] ADD CONSTRAINT [Schedules_wednesday_fkey] FOREIGN KEY ([wednesday]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Schedules] ADD CONSTRAINT [Schedules_thursday_fkey] FOREIGN KEY ([thursday]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Schedules] ADD CONSTRAINT [Schedules_friday_fkey] FOREIGN KEY ([friday]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Schedules] ADD CONSTRAINT [Schedules_saturday_fkey] FOREIGN KEY ([saturday]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Schedules] ADD CONSTRAINT [Schedules_sunday_fkey] FOREIGN KEY ([sunday]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Orders] ADD CONSTRAINT [Orders_resource_id_fkey] FOREIGN KEY ([resource_id]) REFERENCES [dbo].[Resources]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Orders] ADD CONSTRAINT [Orders_resource_group_id_fkey] FOREIGN KEY ([resource_group_id]) REFERENCES [dbo].[Resource_groups]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Attributes_parameters] ADD CONSTRAINT [Attributes_parameters_attribute_id_fkey] FOREIGN KEY ([attribute_id]) REFERENCES [dbo].[Attributes]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Changeover_data] ADD CONSTRAINT [Changeover_data_changeover_group_id_fkey] FOREIGN KEY ([changeover_group_id]) REFERENCES [dbo].[Changeover_groups]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Changeover_data] ADD CONSTRAINT [Changeover_data_attribute_id_fkey] FOREIGN KEY ([attribute_id]) REFERENCES [dbo].[Attributes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Changeover_data] ADD CONSTRAINT [Changeover_data_from_attr_param_id_fkey] FOREIGN KEY ([from_attr_param_id]) REFERENCES [dbo].[Attributes_parameters]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Changeover_data] ADD CONSTRAINT [Changeover_data_to_attr_param_id_fkey] FOREIGN KEY ([to_attr_param_id]) REFERENCES [dbo].[Attributes_parameters]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Changeover_times] ADD CONSTRAINT [Changeover_times_changeover_group_id_fkey] FOREIGN KEY ([changeover_group_id]) REFERENCES [dbo].[Changeover_groups]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Changeover_times] ADD CONSTRAINT [Changeover_times_attribute_id_fkey] FOREIGN KEY ([attribute_id]) REFERENCES [dbo].[Attributes]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[REL_Resource_group] ADD CONSTRAINT [REL_Resource_group_resource_id_fkey] FOREIGN KEY ([resource_id]) REFERENCES [dbo].[Resources]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[REL_Resource_group] ADD CONSTRAINT [REL_Resource_group_resource_group_id_fkey] FOREIGN KEY ([resource_group_id]) REFERENCES [dbo].[Resource_groups]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[REL_Break_Shift] ADD CONSTRAINT [REL_Break_Shift_break_id_fkey] FOREIGN KEY ([break_id]) REFERENCES [dbo].[Breaks]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[REL_Break_Shift] ADD CONSTRAINT [REL_Break_Shift_shift_id_fkey] FOREIGN KEY ([shift_id]) REFERENCES [dbo].[Shifts]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
