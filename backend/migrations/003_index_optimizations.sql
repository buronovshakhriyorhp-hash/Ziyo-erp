-- 003_index_optimizations.sql
-- Tizim tezligini oshirish uchun qolgan B-Tree indexlar qo'shiladi

CREATE INDEX IF NOT EXISTS idx_users_is_active ON erp.users (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_groups_status ON erp.groups (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_group_enrollments_status ON erp.group_enrollments (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source_id ON erp.leads (source_id) WHERE deleted_at IS NULL;

DO $$
BEGIN
    RAISE NOTICE 'Barcha qo''shimcha baza indexlari yaratildi. Tizim maksimal optimallashtirildi.';
END $$;
