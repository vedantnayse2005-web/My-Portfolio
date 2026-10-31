import { useEffect, useState } from "react";
import "./GitHubActivity.css";

const GITHUB_USERNAME = "vedantnayse2005-web";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const CONTRIBUTIONS_URL = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`;
const DAY_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});
const MONTH_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC"
});

const getDateKey = (date) => date.toISOString().slice(0, 10);

const buildWeeks = (contributions) => {
  const contributionsByDate = new Map(
    contributions.map((item) => [item.date, item])
  );
  const firstDate = new Date(`${contributions[0].date}T00:00:00Z`);
  const lastDate = new Date(`${contributions.at(-1).date}T00:00:00Z`);
  const calendarStart = new Date(firstDate);
  calendarStart.setUTCDate(calendarStart.getUTCDate() - calendarStart.getUTCDay());
  const calendarEnd = new Date(lastDate);
  calendarEnd.setUTCDate(calendarEnd.getUTCDate() + (6 - calendarEnd.getUTCDay()));

  const weeks = [];
  let currentWeek = [];
  for (const date = new Date(calendarStart); date <= calendarEnd; date.setUTCDate(date.getUTCDate() + 1)) {
    const dateKey = getDateKey(date);
    const contribution = contributionsByDate.get(dateKey);
    currentWeek.push({
      date: new Date(date),
      dateKey,
      count: contribution?.count || 0,
      level: contribution?.level || 0
    });

    if (date.getUTCDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return weeks;
};

function GitHubActivity() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchActivity = async () => {
      try {
        const response = await fetch(CONTRIBUTIONS_URL, {
          signal: controller.signal,
          headers: { Accept: "application/json" }
        });
        if (!response.ok) {
          throw new Error("GitHub contribution data is temporarily unavailable.");
        }

        const result = await response.json();
        const contributions = Array.isArray(result.contributions)
          ? result.contributions.filter((item) => (
            /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
            Number.isInteger(item.count) &&
            item.count >= 0
          )).sort((first, second) => first.date.localeCompare(second.date))
          : [];

        if (contributions.length === 0) {
          throw new Error("No contribution activity was returned for this period.");
        }

        setActivity({
          weeks: buildWeeks(contributions),
          total: contributions.reduce((sum, item) => sum + item.count, 0),
          days: contributions.length
        });
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message || "Unable to load GitHub activity.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchActivity();
    return () => controller.abort();
  }, []);

  const monthLabels = activity?.weeks.map((week) => {
    const firstOfMonth = week.find((day) => day.date.getUTCDate() === 1);
    return firstOfMonth ? MONTH_FORMATTER.format(firstOfMonth.date) : "";
  }) || [];

  return (
    <section className="github-activity-section" aria-labelledby="github-activity-title">
      <div className="github-activity-heading">
        <span className="section-label">OPEN SOURCE / CONSISTENCY</span>
        <h2 id="github-activity-title">My GitHub Contributions</h2>
        <p>A visual overview of my coding activity and consistency.</p>
      </div>

      <div className="github-activity-panel">
        {loading && (
          <p className="github-activity-message" role="status">
            Loading contribution activity...
          </p>
        )}

        {error && (
          <div className="github-activity-fallback" role="status">
            <p>{error}</p>
            <a href={GITHUB_PROFILE_URL} target="_blank" rel="noreferrer">
              View GitHub profile <span>↗</span>
            </a>
          </div>
        )}

        {activity && (
          <>
            <div className="github-activity-summary">
              <p>
                <strong>{activity.total.toLocaleString()}</strong>
                <span> contributions in the last year</span>
              </p>
              <span className="github-activity-period">{activity.days} days tracked</span>
            </div>

            <div className="github-calendar-scroll" tabIndex="0" aria-label="Scrollable contribution calendar">
              <div
                className="github-calendar"
                style={{ "--week-count": activity.weeks.length }}
                role="img"
                aria-label={`Contribution calendar for the last year, ${activity.total} total contributions`}
              >
                <div className="github-month-row" aria-hidden="true">
                  <span className="github-label-spacer" />
                  <div className="github-month-labels">
                    {monthLabels.map((month, index) => (
                      <span key={`${month}-${index}`}>{month}</span>
                    ))}
                  </div>
                </div>

                <div className="github-calendar-content">
                  <div className="github-weekday-labels" aria-hidden="true">
                    <span />
                    <span>Mon</span>
                    <span />
                    <span>Wed</span>
                    <span />
                    <span>Fri</span>
                    <span />
                  </div>
                  <div className="github-weeks">
                    {activity.weeks.map((week, weekIndex) => (
                      <div className="github-week" key={week[0].dateKey || weekIndex}>
                        {week.map((day) => (
                          <span
                            className="github-day"
                            data-level={Math.max(0, Math.min(4, day.level || 0))}
                            key={day.dateKey}
                            title={`${day.count} contributions on ${DAY_FORMATTER.format(day.date)}`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="github-calendar-footer">
              <div className="github-activity-legend" aria-label="Contribution levels: less to more">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <span className="github-day" data-level={level} key={level} aria-hidden="true" />
                ))}
                <span>More</span>
              </div>
              <a className="github-profile-button" href={GITHUB_PROFILE_URL} target="_blank" rel="noreferrer">
                View GitHub Profile <span>↗</span>
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default GitHubActivity;