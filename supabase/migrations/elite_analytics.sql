-- compliance score: percentage of habits and workouts completed in the last 30 days
create or replace function calculate_client_compliance(cid uuid)
returns float as $$
declare
  total_req int;
  completed int;
  habit_completion_rate float;
  workout_completion_rate float;
begin
  -- habit compliance (last 30 days)
  select count(*), count(case when completed then 1 end)
  into total_req, completed
  from habit_logs
  where client_id = cid
  and date >= current_date - interval '30 days';
  
  if total_req > 0 then
    habit_completion_rate := (completed::float / total_req::float);
  else
    habit_completion_rate := 1.0;
  end if;

  -- workout compliance (last 30 days)
  -- assuming 4 workouts per week = 16 workouts per month target
  select count(distinct date)::float / 16.0
  into workout_completion_rate
  from workout_logs
  where client_id = cid
  and date >= current_date - interval '30 days';
  
  if workout_completion_rate > 1.0 then workout_completion_rate := 1.0; end if;

  return (habit_completion_rate + workout_completion_rate) / 2.0 * 100.0;
end;
$$ language plpgsql security definer;

-- churn risk: High risk if compliance < 40% OR no activity for 7 days
create or replace function get_client_risk_score(cid uuid)
returns text as $$
declare
  compliance float;
  last_activity date;
begin
  compliance := calculate_client_compliance(cid);
  
  select max(date) into last_activity
  from workout_logs
  where client_id = cid;
  
  if compliance < 40.0 then
    return 'High';
  elsif compliance < 70.0 or (current_date - last_activity) > 7 then
    return 'Medium';
  else
    return 'Low';
  end if;
end;
$$ language plpgsql security definer;
