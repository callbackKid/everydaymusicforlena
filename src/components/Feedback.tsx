import { useState } from 'react';
import type { Rating, Recommendation } from '../lib/songs';

interface FeedbackProps {
  /** Current saved rating for the song (`null` = no answer yet). */
  value: Recommendation;
  /** Called when a choice is confirmed; should persist the new value. */
  onRate: (value: Rating) => Promise<void>;
}

interface Option {
  label: string;
  value: Rating;
  modifier: string;
}

const OPTIONS: Option[] = [
  { value: 'more', label: 'More of this stuff!', modifier: 'up' },
  { value: 'average', label: 'It was average', modifier: 'meh' },
  { value: 'no', label: "I don't like it", modifier: 'down' },
];

// idle       -> nothing chosen yet
// confirming -> a choice is picked, waiting for "Are you sure?"
// saving     -> persisting the choice
// done       -> saved; buttons locked
// error      -> save failed; back to choosing
type Phase = 'idle' | 'confirming' | 'saving' | 'done' | 'error';

/**
 * Three feedback buttons with a confirmation step. Clicking a rating asks
 * "Are you sure?"; confirming saves `recommendation` ('more' / 'average' /
 * 'no') via `onRate` and locks the buttons so it can't be submitted twice.
 * A song that already has a saved rating starts locked; `null` means Lena
 * hasn't answered yet, so the buttons stay open.
 */
export function Feedback({ value, onRate }: FeedbackProps) {
  const [phase, setPhase] = useState<Phase>(value === null ? 'idle' : 'done');
  const [chosen, setChosen] = useState<Option | null>(
    OPTIONS.find((o) => o.value === value) ?? null,
  );

  const locked = phase === 'done' || phase === 'saving';

  function pick(option: Option) {
    if (locked) return;
    setChosen(option);
    setPhase('confirming');
  }

  function cancel() {
    setChosen(null);
    setPhase('idle');
  }

  async function confirm() {
    if (!chosen) return;
    setPhase('saving');
    try {
      await onRate(chosen.value);
      setPhase('done');
    } catch {
      setPhase('error');
    }
  }

  return (
    <div className="feedback">
      <div className="feedback__prompt">
        {phase === 'done' ? 'Thanks — saved! 🎶' : 'What did you think?'}
      </div>

      <div className="feedback__row">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`fb-btn fb-btn--${option.modifier}${
              chosen?.value === option.value ? ' is-selected' : ''
            }`}
            aria-pressed={chosen?.value === option.value}
            disabled={
              locked ||
              (phase === 'confirming' && chosen?.value !== option.value)
            }
            onClick={() => pick(option)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {phase === 'confirming' && chosen && (
        <div className="feedback__confirm">
          <span className="feedback__confirm-q">Send “{chosen.label}”?</span>
          <div className="feedback__confirm-actions">
            <button
              type="button"
              className="fb-confirm fb-confirm--yes"
              onClick={confirm}
            >
              Yes, send
            </button>
            <button
              type="button"
              className="fb-confirm fb-confirm--no"
              onClick={cancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'saving' && <div className="feedback__status">Saving…</div>}

      {phase === 'error' && (
        <div className="feedback__error">
          Couldn’t save that — check your connection and try again.
        </div>
      )}
    </div>
  );
}
