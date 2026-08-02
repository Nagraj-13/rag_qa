import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { Client } = pg;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@email.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seedAdmin() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!dbUrl || dbUrl.includes('your-database-url')) {
    console.error('\n❌ DATABASE_URL is not set. Skipping admin seed.');
    process.exit(1);
  }

  console.log('⚡ Connecting to database...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected.');

    // 1. Create user_roles table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('📦 user_roles table ensured.');

    // 2. Create system_settings table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY DEFAULT 'global',
        knowledge_mode TEXT NOT NULL DEFAULT 'okf',
        router_strategy TEXT NOT NULL DEFAULT 'smart',
        updated_by TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('📦 system_settings table ensured.');

    // 3. Upsert default system settings
    await client.query(`
      INSERT INTO system_settings (id, knowledge_mode, router_strategy)
      VALUES ('global', 'okf', 'smart')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('⚙️  Default system settings ensured.');

    // 4. Check if admin user role exists
    const { rows: existingRoles } = await client.query(
      'SELECT * FROM user_roles WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existingRoles.length === 0) {
      await client.query(
        'INSERT INTO user_roles (email, role) VALUES ($1, $2)',
        [ADMIN_EMAIL, 'admin']
      );
      console.log(`👤 Admin role created for: ${ADMIN_EMAIL}`);
    } else {
      console.log(`👤 Admin role already exists for: ${ADMIN_EMAIL}`);
    }

    // 5. If using Supabase Auth, try to create the admin user via auth.users
    //    This uses Supabase's internal schema — only works with direct DB access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      console.log('🔐 Attempting to create admin auth user via Supabase Admin API...');
      try {
        const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { role: 'admin' },
          }),
        });

        if (res.ok) {
          const userData = await res.json();
          console.log(`✅ Admin auth user created: ${userData.email} (ID: ${userData.id})`);
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.msg?.includes('already been registered') || errData.message?.includes('already been registered')) {
            console.log('✅ Admin auth user already exists in Supabase Auth.');
          } else {
            console.warn('⚠️  Supabase admin user creation response:', res.status, JSON.stringify(errData));
          }
        }
      } catch (fetchErr) {
        console.warn('⚠️  Could not reach Supabase Admin API:', fetchErr.message);
        console.log('   (Admin user can be created manually via Supabase Dashboard or by registering through the app)');
      }
    } else {
      console.log('\n📝 Note: SUPABASE_SERVICE_ROLE_KEY not found.');
      console.log(`   Create the admin user manually by registering with:`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    }

    console.log('\n🎉 Admin seed completed!\n');

  } catch (err) {
    console.error('❌ Admin seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedAdmin();
