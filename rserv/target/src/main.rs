use tokio::runtime::Runtime;

mod util;
use util::utility::Utility;

#[tokio::main]
async fn main() {
    let x = Utility::rand_num(0.0, 1.0);
}
