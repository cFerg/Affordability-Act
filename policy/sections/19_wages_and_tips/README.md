# Wage Baselines & Tipped Work (Affordability Link)

## §19.1 No Subminimum for Tipped Workers
Within the jurisdiction, the **cash wage** for tipped occupations must be at least the **full local minimum wage**. Tips are **extra** and may not offset base pay.

## §19.2 Service Charges vs Tips
If a fee is presented like a gratuity, 100% is distributed to service staff and **does not** count toward base wage obligations. If retained by the business, it must be labeled **“service fee (not a tip)”** on receipts and disclosure signage.

## §19.3 Pay Transparency & Method
Employers must provide line-item pay statements (base, tips, fees) and offer no-fee direct deposit (§7 Payment Integrity).

## §19.4 Wage Index Integrity
For the Act’s **Wage Index**, the labor department publishes median wages **reflecting full minimums without tip credits**. If federal/state datasets still include subminimums, the index is adjusted upward to neutralize tip-credit artifacts.

## §19.5 Enforcement (Back Pay, Damages, Records)

**(a) Non-waivable right.** The rights in §19 are non-waivable by contract, policy, or private agreement.

**(b) Tips are not an offset.** Tips are the employee’s property and may not be credited toward meeting base wage obligations. Back pay is calculated **without** subtracting tips.

**(c) Back-pay calculation (per pay period).**
For each pay period p and covered employee i:

- Let `H_i,p` = hours worked.
- Let `W_paid_i,p` = cash wage rate actually paid (excluding tips/service charges distributed).
- Let `W_min_p` = applicable local minimum wage for the period (before tips).
- **Back pay owed** = `max(0, (W_min_p − W_paid_i,p)) × H_i,p`.

If overtime or premium hours apply, calculate at the appropriate premium using `W_min_p` as the base.

**(d) Example.**
If an employee worked 30 hours at $6.00/hr cash wage while `W_min_p` = $12.00, and received $300 in tips:
- Back pay = `(12 − 6) × 30 = $180`.
- Tips do not reduce this amount.

**(e) Misrepresented charges.**
If a charge was presented as a gratuity, 100% must be distributed to service staff. Any undistributed amount is owed **in addition** to back pay, plus penalties.

**(f) Damages & penalties.**
- Underpayments: back pay + **liquidated damages** equal to the underpayment *(Policy Dial: 1.0× default; up to 2.0× for willful)*.
- Civil penalty per employee per pay period *(Policy Dial: e.g., $100; $250 if willful/repeat)*.
- Interest at statutory rate from date due.
- Attorney’s fees and costs to prevailing employee.

**(g) Records & burden.**
Employers must retain accurate time and pay records for 4 years and provide itemized statements (base, tips, service fees distributed). If records are incomplete, a reasonable employee estimate is **prima facie** and the burden shifts to the employer.

**(h) Retaliation.**
Prohibited. Make-whole relief, civil penalties, and reinstatement available.

**(i) Cure window (optional).**
First-time, non-willful violations self-reported and paid within 30 days may waive civil penalties (not back pay or interest). *(Policy Dial)*

**(j) Coordination.**
This section complements (does not diminish) federal/state wage laws. Where other law provides greater relief, the greater relief applies.