// Realistic fictional sample data covering all 6 PII categories, repeated entities,
// decoy numbers, Verhoeff-valid Aadhaar, Luhn-valid test cards, and mixed formats.
// All data is entirely fictional for demonstration purposes only.

export const SAMPLE_TEXT = `=== SUPPORT TICKET #2026-11-TKT-00847 ===
Submitted: 2026-11-27 09:14:33 UTC
Priority: HIGH | Build: v2.14.3.1 | Tracking: TRK-9876543210-X

--- Customer Information ---
Name: Priya Mehta
Email: priya.mehta@techcorp.in
Alternate Email: priya.mehta@techcorp.in
Secondary Contact: rahul.sharma+support@company.co.in

Phone (Primary): +91 9876543210
Phone (WhatsApp): +91-98765-43210
Phone (Landline): 09876543210
International Line: +1 202-555-0145
Office (US): (202) 555-0145

--- Identity Documents ---
PAN Number: BGLPH9876M
Company PAN: AXZPC4567K
Aadhaar (Validated ✓): 2345 6789 0127
Aadhaar (Format Only ✗): 1234 5678 9012

--- Payment Information ---
Credit Card (Visa): 4532 0151 1283 0366
Credit Card (Mastercard): 5425 2334 3010 9903
Luhn-FAIL (NOT a card): 1234 5678 9012 3456
Order ID: ORD-20261127-98765432
Invoice Ref: INV-2026-456789

--- Network / Infrastructure ---
Server IPv4: 192.168.10.45
Gateway: 10.0.0.1
Public IP: 203.0.113.42
IPv6 Endpoint: 2001:db8::1
IPv6 Full: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
IPv4-mapped IPv6: ::ffff:192.0.2.128
Timestamp (NOT an IP): 12:34:56
Version (NOT an IP): v1.2.3.4

--- Repeated Entities (pseudonymization consistency check) ---
Same email again: priya.mehta@techcorp.in
Same phone: 9876543210
Same Aadhaar: 2345-6789-0127
Same card (hyphenated): 4532-0151-1283-0366
Same PAN: BGLPH9876M

--- Notes ---
Customer reported issue with IP 192.168.10.45 dropping packets.
Escalate to rahul.sharma+support@company.co.in if unresolved.
Do NOT store raw PAN or Aadhaar in support tickets.
Ticket version: 2.3.1 | Schema: 1.0.4

=== END OF TICKET ===`;

export const SAMPLE_CSV = `ticket_id,customer_email,phone,pan,aadhaar,card,server_ip,notes
TKT-001,priya.mehta@techcorp.in,+91 9876543210,BGLPH9876M,2345 6789 0127,4532 0151 1283 0366,192.168.10.45,"High priority ticket, needs review"
TKT-002,rahul.sharma+support@company.co.in,+1 202-555-0145,AXZPC4567K,2001 8765 4321 0127,,203.0.113.42,International escalation
TKT-003,priya.mehta@techcorp.in,09876543210,BGLPH9876M,,,10.0.0.1,"Duplicate of TKT-001, same customer"
TKT-004,alice.wang@example.org,(202) 555-0145,,,,2001:db8::1,"IPv6 node, ""quoted"" field"
TKT-005,,+91-98765-43210,,,,::ffff:192.0.2.128,IPv4-mapped IPv6 endpoint
`;
