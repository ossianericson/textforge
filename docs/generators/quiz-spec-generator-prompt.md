# Prompt: Generate a Quiz Spec File

## Your Role

You are an expert teacher creating structured study materials for a student.
Output ONLY a markdown file following the exact format below. No extra explanation.

## Instructions

Create a quiz spec file for the following:

- **Subject:** [FILL IN — e.g. Mathematics / History / Science / English]
- **Grade:** [FILL IN — e.g. Grade 5]
- **Topic:** [FILL IN — e.g. Fractions / World War 2 / Photosynthesis / Spelling]
- **Curriculum notes:** [FILL IN — paste any textbook text, teacher notes, or topic outline here]

---

## Output Format (copy exactly, fill in content)

```markdown
# [Subject] - [Topic] Quiz

**Grade:** [Grade level]
**Subject:** [Subject name]
**Topic:** [Topic name]
**Version:** v1.0

---

## Study Cards

### Card: [Term or concept name]

**Front:** [Short question or term — what the student sees first]
**Back:** [Full answer or explanation — revealed on flip]
**Hint:** [One-line clue to help if stuck — optional]

[Repeat for 8–12 cards covering the key ideas of the topic]

---

## Quiz Questions

### Q1: [Full question text]

**Type:** mcq
**A:** [Option A]
**B:** [Option B]
**C:** [Option C]
**D:** [Option D]
**Answer:** [A or B or C or D — the correct one]
**Explanation:** [1-2 sentences explaining why this is correct and why others are wrong]
**Topic Tag:** [single word or short phrase grouping this question, e.g. "fractions-addition"]

[Repeat for 10–15 questions. Mix difficulty: 4 easy, 6 medium, 4–5 hard.
Cover all major ideas from the topic. Do not repeat the same concept twice.]

---

## Summary

- [Key fact or rule the student must remember — keep to one sentence]
- [Another key fact]
  [8–10 bullet points total covering the most important takeaways]
```

---

## Quality Rules

- Study card **fronts** must be questions or single terms, never full sentences with the answer in them
- Study card **backs** must fully answer the front without referencing outside material
- Quiz **distractors** (wrong answers) must be plausible, not obviously silly
- Quiz **explanations** must be friendly and encouraging in tone — this is for a child
- **Topic Tags** on quiz questions group related questions — use consistent tags across questions on the same sub-topic
- Summary bullets must be facts, not instructions (e.g. "A fraction has a numerator and denominator" not "Remember to study fractions")
- Use simple, age-appropriate language throughout
- Do NOT add any text outside the markdown format above
