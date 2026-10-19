-- Mock Data Seed Script
-- เซลล์ 5 คน, งาน 250, reports 500+
-- ย้อนหลัง 60 วัน

BEGIN;

-- ============================================================
-- 1. SALES REPS (5 คน)
-- ============================================================
INSERT INTO sales_reps (id, line_user_id, display_name, picture_url, nickname, area, status, created_at, updated_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'U0000000000000000000000000000001', 'สมชาย ใจดี', '', 'ชาย', 'โคราช', 'active', NOW() - INTERVAL '90 days', NOW()),
  ('a1000000-0000-0000-0000-000000000002', 'U0000000000000000000000000000002', 'สมหญิง รักงาน', '', 'หญิง', 'บุรีรัมย์', 'active', NOW() - INTERVAL '90 days', NOW()),
  ('a1000000-0000-0000-0000-000000000003', 'U0000000000000000000000000000003', 'ธนพล เก่งมาก', '', 'พล', 'ชัยภูมิ', 'active', NOW() - INTERVAL '90 days', NOW()),
  ('a1000000-0000-0000-0000-000000000004', 'U0000000000000000000000000000004', 'วิภา สู้งาน', '', 'ภา', 'นครราชสีมา', 'active', NOW() - INTERVAL '90 days', NOW()),
  ('a1000000-0000-0000-0000-000000000005', 'U0000000000000000000000000000005', 'กิตติ ไม่ท้อ', '', 'กิต', 'สุรินทร์', 'active', NOW() - INTERVAL '90 days', NOW())
ON CONFLICT (line_user_id) DO NOTHING;

-- ============================================================
-- 2. SITES + REPORTS (generate via PL/pgSQL)
-- ============================================================
DO $$
DECLARE
  rep_ids UUID[] := ARRAY[
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005'
  ];
  amphoes TEXT[] := ARRAY[
    'เมืองนครราชสีมา','เมืองนครราชสีมา','เมืองนครราชสีมา','เมืองนครราชสีมา','เมืองนครราชสีมา','เมืองนครราชสีมา',
    'ปากช่อง','ปากช่อง','ปากช่อง','ปากช่อง',
    'สีคิ้ว','สีคิ้ว','สีคิ้ว',
    'ด่านขุนทด','ด่านขุนทด','ด่านขุนทด',
    'โนนสูง','โนนสูง',
    'พิมาย','พิมาย',
    'บัวใหญ่','บัวใหญ่',
    'ครบุรี','ครบุรี',
    'โชคชัย',
    'สูงเนิน'
  ];
  stages TEXT[] := ARRAY['เริ่มก่อสร้าง','กำลังสร้าง','ใกล้เสร็จ','รอตัดสินใจ','เสนอราคาแล้ว'];
  dm TEXT[] := ARRAY['เจ้าของ','ผู้รับเหมา','วิศวกร','สถาปนิก','เจ้าของ','ผู้รับเหมา','เจ้าของ'];
  cnames TEXT[] := ARRAY['สมศักดิ์','สมปอง','วิชัย','ประยุทธ','สุรชัย','อนันต์','ธีรพงษ์','มานพ','สุนทร','ชาติชาย',
    'แดง','เขียว','ขาว','ดำ','ทอง','เงิน','นิล','มณี','ศรี','สุข',
    'วิไล','สมใจ','รัตนา','พรทิพย์','จันทร์','ดาว','เดือน','น้ำ','ฟ้า','ดิน'];
  contractors TEXT[] := ARRAY['ช่างโจ้','ช่างแมน','ช่างสมบัติ','ช่างเอก','ช่างบอย','ช่างหนุ่ม','ช่างเล็ก','ช่างใหญ่','','',''];
  lost_reasons TEXT[] := ARRAY['ราคาสูง','ราคาสูง','ราคาสูง','ใช้คู่แข่ง','ใช้คู่แข่ง','ส่งช้า','เปลี่ยนใจ','อื่นๆ'];
  competitors TEXT[] := ARRAY['SCG','SCG','TPI','CPAC','ร้านวัสดุท้องถิ่น','ร้านวัสดุท้องถิ่น','ช่างเหล็กข้างบ้าน',''];
  notes_new TEXT[] := ARRAY['ไปเจอลูกค้าครั้งแรก สนใจเหล็ก','สำรวจหน้างาน ลูกค้าถามราคา','เจอช่างที่หน้างาน แนะนำสินค้า','ลูกค้าโทรมาถามราคาเหล็กเส้น','ไปดูหน้างานใหม่ กำลังเทฐานราก','พบลูกค้าที่ร้าน สนใจสินค้า','ลูกค้าเดินเข้ามาสอบถาม'];
  notes_fu TEXT[] := ARRAY['ติดตามครั้งที่ 2 ลูกค้ายังสนใจ','ส่งใบเสนอราคาแล้ว รอตอบ','ลูกค้ากำลังเทียบราคา','โทรตาม ลูกค้าบอกรออีก 2 อาทิตย์','ไปพบลูกค้า ตกลงราคาเบื้องต้น','ลูกค้าขอดูตัวอย่างสินค้า','ติดตามงาน ช่างบอกยังไม่ถึงขั้นใช้เหล็ก','โทรนัดพบ ลูกค้าว่างสัปดาห์หน้า'];
  notes_won TEXT[] := ARRAY['ปิดการขายได้ ลูกค้าสั่ง 5 ตัน','ลูกค้าตกลงสั่งซื้อแล้ว','ปิดงาน สั่งเหล็กรอบแรก','จบดีล ลูกค้าชอบราคาเรา'];
  notes_lost TEXT[] := ARRAY['ลูกค้าเลือกซื้อที่อื่น','แพ้ราคาคู่แข่ง','ลูกค้าเปลี่ยนใจไม่สร้างแล้ว','ช่างพาไปซื้อที่อื่น'];

  v_site_id UUID;
  v_rep_id UUID;
  v_created DATE;
  v_status TEXT;
  v_stage TEXT;
  v_amphoe TEXT;
  v_phone TEXT;
  v_code TEXT;
  v_report_count INT;
  v_next_fu DATE;
  v_lost_reason TEXT;
  v_competitor TEXT;
  i INT;
  j INT;
  day_offset INT;
  counter INT;
  daily_counter INT[];
  report_date TIMESTAMP;
BEGIN
  -- สร้าง daily counter สำหรับ site_code
  daily_counter := ARRAY[]::INT[];
  FOR i IN 0..60 LOOP
    daily_counter := daily_counter || 0;
  END LOOP;

  counter := 0;
  FOR i IN 1..250 LOOP
    v_site_id := gen_random_uuid();
    v_rep_id := rep_ids[1 + (i-1) % 5];

    -- กระจาย created_at ย้อนหลัง 60 วัน
    day_offset := (i * 60 / 250);
    IF day_offset > 60 THEN day_offset := 60; END IF;
    v_created := CURRENT_DATE - day_offset;

    -- site_code: YYMMDD-NN (BE year)
    daily_counter[day_offset+1] := daily_counter[day_offset+1] + 1;
    v_code := 'M' || TO_CHAR(v_created, 'MMDD') || '-' || LPAD(daily_counter[day_offset+1]::TEXT, 2, '0');

    -- status distribution
    CASE
      WHEN i <= 137 THEN v_status := 'following';
      WHEN i <= 200 THEN v_status := 'won';
      WHEN i <= 238 THEN v_status := 'lost';
      ELSE v_status := 'cancelled';
    END CASE;

    v_stage := stages[1 + (i % 5)];
    v_amphoe := amphoes[1 + (i % array_length(amphoes,1))];
    v_phone := '08' || LPAD((50000000 + i * 37)::TEXT, 8, '0');

    -- next_follow_up_date สำหรับ following
    v_next_fu := NULL;
    IF v_status = 'following' THEN
      CASE
        WHEN i % 10 <= 2 THEN v_next_fu := CURRENT_DATE - (1 + i % 14); -- เลยกำหนด
        WHEN i % 10 = 3 THEN v_next_fu := CURRENT_DATE; -- วันนี้
        WHEN i % 10 <= 6 THEN v_next_fu := CURRENT_DATE + (1 + i % 7); -- 1-7 วัน
        ELSE v_next_fu := CURRENT_DATE + (8 + i % 23); -- 8-30 วัน
      END CASE;
    END IF;

    -- lost reason
    v_lost_reason := '';
    v_competitor := '';
    IF v_status = 'lost' THEN
      v_lost_reason := lost_reasons[1 + (i % array_length(lost_reasons,1))];
      v_competitor := competitors[1 + (i % array_length(competitors,1))];
    END IF;

    -- report count
    CASE v_status
      WHEN 'following' THEN v_report_count := 1 + (i % 3);
      WHEN 'won' THEN v_report_count := 2 + (i % 3);
      WHEN 'lost' THEN v_report_count := 1 + (i % 2);
      ELSE v_report_count := 1;
    END CASE;

    -- INSERT site
    INSERT INTO sites (
      id, site_code, customer_name, customer_type, contractor_name, decision_maker,
      phone, latitude, longitude, address, amphoe, tambon, province,
      stage, status, lost_reason, competitor,
      expected_order_date, next_follow_up_date, owner_rep_id, group_id,
      report_count, last_report_at, created_at, updated_at
    ) VALUES (
      v_site_id, v_code,
      cnames[1 + (i % array_length(cnames,1))],
      CASE WHEN i % 3 = 0 THEN 'เก่า' ELSE 'ใหม่' END,
      contractors[1 + (i % array_length(contractors,1))],
      dm[1 + (i % array_length(dm,1))],
      v_phone,
      CASE WHEN i % 5 != 0 THEN 14.5 + random() ELSE NULL END,
      CASE WHEN i % 5 != 0 THEN 101.5 + random() * 2 ELSE NULL END,
      'หมู่ ' || (i % 15 + 1) || ' ต.' || v_amphoe,
      v_amphoe, '', 'นครราชสีมา',
      v_stage, v_status, v_lost_reason, v_competitor,
      CASE WHEN v_status = 'following' THEN (CURRENT_DATE + (i % 30 + 10))::TIMESTAMP ELSE NULL END,
      v_next_fu,
      v_rep_id, '',
      v_report_count,
      (v_created + (v_report_count - 1) * 5)::TIMESTAMP,
      v_created::TIMESTAMP, NOW()
    );

    -- INSERT reports
    FOR j IN 1..v_report_count LOOP
      report_date := (v_created + (j-1) * INTERVAL '5 days' + (random() * INTERVAL '2 days'))::TIMESTAMP;

      INSERT INTO site_reports (
        id, site_id, rep_id, report_type, note, stage, status,
        lost_reason, competitor, decision_maker,
        next_follow_up_date, report_date, source, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_site_id, v_rep_id,
        CASE WHEN j = 1 THEN 'new' ELSE 'follow_up' END,
        CASE
          WHEN j = 1 THEN notes_new[1 + (i % array_length(notes_new,1))]
          WHEN j = v_report_count AND v_status = 'won' THEN notes_won[1 + (i % array_length(notes_won,1))]
          WHEN j = v_report_count AND v_status = 'lost' THEN notes_lost[1 + (i % array_length(notes_lost,1))]
          ELSE notes_fu[1 + (i % array_length(notes_fu,1))]
        END,
        stages[1 + ((i+j) % 5)],
        CASE WHEN j = v_report_count THEN v_status ELSE 'following' END,
        CASE WHEN j = v_report_count AND v_status = 'lost' THEN v_lost_reason ELSE '' END,
        CASE WHEN j = v_report_count AND v_status = 'lost' THEN v_competitor ELSE '' END,
        dm[1 + (i % array_length(dm,1))],
        CASE WHEN j < v_report_count THEN report_date + INTERVAL '7 days' ELSE v_next_fu END,
        report_date, 'liff', report_date, report_date
      );
    END LOOP;

    -- INSERT contact
    INSERT INTO contacts (id, phone, site_id, is_primary, created_at, updated_at)
    VALUES (gen_random_uuid(), v_phone, v_site_id, true, v_created::TIMESTAMP, v_created::TIMESTAMP);

    counter := counter + 1;
  END LOOP;

  RAISE NOTICE 'Created % sites with reports and contacts', counter;
END $$;

COMMIT;
