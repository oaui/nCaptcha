

pub struct Utility;

impl Utility {
    pub fn rand_num(min: f64, max: f64) -> f64 {

        return rand::random::<f64>() * (max - min) + min;

    }
    pub fn is_incognito(data : String) -> bool {

        return true;

    }
}