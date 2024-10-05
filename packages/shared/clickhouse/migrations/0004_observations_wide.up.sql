CREATE TABLE observations_wide
(
    `id` String,
    trace_id Nullable(String),
    `name` Nullable(String),
    `project_id` String,
    `timestamp` DateTime64(3),
    `user_id` Nullable(String),
    `metadata` Map(String, String),
    `release` Nullable(String),
    `version` Nullable(String),
    `public` Bool,
    `bookmarked` Bool,
    `tags` Array(String),
    `input` Nullable(String),
    `output` Nullable(String),
    `session_id` Nullable(String),
    `created_at` DateTime64(3),
    `updated_at` DateTime64(3),
    event_ts DateTime64(3),
    `type` LowCardinality(String),
    `parent_observation_id` Nullable(String),
    `start_time` DateTime64(3),
    `end_time` Nullable(DateTime64(3)),
    `level` LowCardinality(String),
    `status_message` Nullable(String),
    `provided_model_name` Nullable(String),
    `internal_model_id` Nullable(String),
    `model_parameters` Nullable(String),
    `provided_input_usage_units` Nullable(Decimal64(12)),
    `provided_output_usage_units` Nullable(Decimal64(12)),
    `provided_total_usage_units` Nullable(Decimal64(12)),
    `input_usage_units` Nullable(Decimal64(12)),
    `output_usage_units` Nullable(Decimal64(12)),
    `total_usage_units` Nullable(Decimal64(12)),
    `unit` Nullable(String),
    `provided_input_cost` Nullable(Decimal64(12)),
    `provided_output_cost` Nullable(Decimal64(12)),
    `provided_total_cost` Nullable(Decimal64(12)),
    `input_cost` Nullable(Decimal64(12)),
    `output_cost` Nullable(Decimal64(12)),
    `total_cost` Nullable(Decimal64(12)),
    `completion_start_time` Nullable(DateTime64(3)),
    `time_to_first_token` Nullable(DateTime64(3)),
    `prompt_id` Nullable(String),
    `prompt_name` Nullable(String),
    `prompt_version` Nullable(UInt16)
) ENGINE = ReplacingMergeTree
ORDER BY (project_id, id);

CREATE MATERIALIZED VIEW mv_traces_to_observations_wide TO observations_wide AS
SELECT 
    o.*,
    t.timestamp AS trace_timestamp,
    t.name AS trace_name,
    t.user_id AS trace_user_id,
    t.metadata AS trace_metadata,
    t.release AS trace_release,
    t.version AS trace_version,
    t.project_id AS trace_project_id,
    t.public AS trace_public,
    t.bookmarked AS trace_bookmarked,
    t.tags AS trace_tags,
    t.input AS trace_input,
    t.output AS trace_output,
    t.session_id AS trace_session_id,
    t.event_ts AS trace_event_ts
FROM traces t
LEFT JOIN observations o ON t.id = o.trace_id;

CREATE MATERIALIZED VIEW mv_observations_to_observations_wide TO observations_wide AS
SELECT 
    o.*,
    t.timestamp AS trace_timestamp,
    t.name AS trace_name,
    t.user_id AS trace_user_id,
    t.metadata AS trace_metadata,
    t.release AS trace_release,
    t.version AS trace_version,
    t.project_id AS trace_project_id,
    t.public AS trace_public,
    t.bookmarked AS trace_bookmarked,
    t.tags AS trace_tags,
    t.input AS trace_input,
    t.output AS trace_output,
    t.session_id AS trace_session_id,
    t.event_ts AS trace_event_ts
FROM observations o
LEFT JOIN traces t ON t.id = o.trace_id;


